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
  assert.equal(sent.preview?.state === 'failed' && sent.preview.code, 'APP_MIGRATION_FAILED')
  assert.deepEqual(sent.versions, [
    [2, 'failed', 'APP_MIGRATION_FAILED', false],
    [1, 'ready', null, true],
  ])
  assert.deepEqual(sent.tables, UNCHANGED)
})

test('o envio com GRANT não entra', async (t) => {
  const grant = { id: '002_publico', statements: ['GRANT SELECT ON recado TO public'] }
  const sent = await sentAfterLive(t, grant)
  assert.equal(sent.preview?.state === 'failed' && sent.preview.code, 'APP_MIGRATION_REFUSED')
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

test('o motivo vai sem valor', async (t) => {
  const subject = await companyForVersions(t)
  const seed = {
    id: '002_repetidos',
    statements: [
      "INSERT INTO recado (texto) VALUES ('(11) 99999-0000')",
      "INSERT INTO recado (texto) VALUES ('(11) 99999-0000')",
    ],
  }
  const unique = {
    id: '003_unico',
    statements: ['ALTER TABLE recado ADD CONSTRAINT recado_texto_key UNIQUE (texto)'],
  }
  await send(subject, subject.ana, folder({ migrations: [MIGRATION, seed] }))
  const database = await send(
    subject,
    subject.ana,
    folder({ migrations: [MIGRATION, seed, unique] }),
  )
  assert.deepEqual(database.preview, {
    state: 'failed',
    number: 2,
    code: 'APP_MIGRATION_FAILED',
    cause: { kind: 'database', sqlstate: '23505', table: 'recado', constraint: 'recado_texto_key' },
  })
  const lost = await send(
    subject,
    subject.ana,
    folder({
      migrations: [
        MIGRATION,
        seed,
        { id: '003_renomeia', statements: ['ALTER TABLE recado RENAME COLUMN texto TO mensagem'] },
      ],
    }),
  )
  assert.deepEqual(lost.preview, {
    state: 'failed',
    number: 3,
    code: 'APP_MIGRATION_FAILED',
    cause: { kind: 'database', sqlstate: 'CX001', table: 'recado', column: 'texto' },
  })
  const grant = await send(
    subject,
    subject.ana,
    folder({
      migrations: [
        MIGRATION,
        seed,
        { id: '003_publico', statements: ['GRANT SELECT ON recado TO public'] },
      ],
    }),
  )
  assert.deepEqual(grant.preview, {
    state: 'failed',
    number: 4,
    code: 'APP_MIGRATION_REFUSED',
    cause: { kind: 'rule', migration: '003_publico', statement: 1, subject: 'GrantStmt' },
  })
  const everything =
    [database, lost, grant].map(({ raw }) => raw).join() + JSON.stringify(subject.hub.lines)
  assert.ok(!everything.includes('99999'), 'no saved value in the stream or the log')
})

test('a tabela de outro esquema com nome longo recusa com o motivo inteiro', async (t) => {
  const subject = await companyForVersions(t)
  const named = 'app_vendas.historico_de_alteracoes_das_encomendas_do_cliente'
  const sent = await send(
    subject,
    subject.ana,
    folder({
      migrations: [MIGRATION, { id: '002_fora', statements: [`CREATE TABLE ${named} (v text)`] }],
    }),
  )
  assert.equal(sent.preview?.state === 'failed' && sent.preview.code, 'APP_MIGRATION_REFUSED')
  assert.equal(sent.preview?.state === 'failed' && sent.preview.cause?.kind, 'rule')
})
