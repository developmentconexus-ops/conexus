import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ProjectId } from '@conexus/hub-api'
import { appTablesOf } from '../../platform/test-company-postgres.ts'
import { companyForVersions, folder, listed, MIGRATION, send } from './test-versions.ts'

/** A Projeto whose first version is live, then a second whose migration `second` brings. */
async function sentAfterLive(t: Parameters<typeof companyForVersions>[0], second: object) {
  const subject = await companyForVersions(t)
  assert.deepEqual((await send(subject, subject.ana)).preview, { state: 'ready', number: 1 })
  const turned = await send(subject, subject.ana, folder({ migrations: [MIGRATION, second] }))
  const versions = (await listed(subject)).map((one) => [
    one.number,
    one.state,
    one.failure,
    one.live,
  ])
  const tables = await appTablesOf(subject.owner, ProjectId.parse(subject.projectId))
  return { preview: turned.preview, versions, tables, lines: subject.hub.lines }
}

const UNCHANGED = { tables: ['conexus_migration', 'recado'], ledger: [MIGRATION.id] }

test('o envio que quebraria o Voltar não entra', async (t) => {
  const rename = {
    id: '002_mensagem',
    statements: ['ALTER TABLE recado RENAME COLUMN texto TO mensagem'],
  }
  const sent = await sentAfterLive(t, rename)
  assert.deepEqual(sent.preview, { state: 'failed', number: 2, code: 'APP_MIGRATION_FAILED' })
  assert.deepEqual(sent.versions, [
    [2, 'failed', 'APP_MIGRATION_FAILED', false],
    [1, 'ready', null, true],
  ])
  assert.deepEqual(sent.tables, UNCHANGED)
})

test('o envio com GRANT não entra', async (t) => {
  const grant = { id: '002_publico', statements: ['GRANT SELECT ON recado TO public'] }
  const sent = await sentAfterLive(t, grant)
  assert.deepEqual(sent.preview, { state: 'failed', number: 2, code: 'APP_MIGRATION_REFUSED' })
  assert.deepEqual(sent.versions, [
    [2, 'failed', 'APP_MIGRATION_REFUSED', false],
    [1, 'ready', null, true],
  ])
  assert.deepEqual(sent.tables, UNCHANGED)
  const refused = sent.lines.filter((line) => line.message === 'APP_MIGRATION_REFUSED')
  assert.deepEqual(
    refused.map(({ fields }) => [fields.migration, fields.statement, fields.subject]),
    [['002_publico', 1, 'GrantStmt']],
  )
  assert.ok(!JSON.stringify(sent.lines).includes('GRANT SELECT'), 'the log carries no SQL')
})
