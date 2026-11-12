import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import {
  appLogin,
  appLoginPassword,
  CopyId,
  CopyProposalId,
  listCopyRuns,
  PersonId,
} from '@conexus/hub-api'
import pg from 'pg'
import { call, memberOn } from '../identity/test-hub.ts'
import { asSync, TEST_APP_LOGIN_KEY } from './test-copies.ts'
import type { ListProposalsOn } from './test-list-proposals.ts'
import { listProposalsOn } from './test-list-proposals.ts'
import { STORE_A, STORE_B } from './test-sources.ts'

const BUYER_NICKNAME = 'COMPRADORFICTICIO'
const PERSONAL_COPY = {
  version: 2,
  source: { kind: 'OPERATION', operation: 'pedidos', input: {} },
  description: 'Os pedidos e o apelido do comprador',
  columns: [
    { name: 'id', type: 'bigint', path: 'id' },
    { name: 'status', type: 'text', path: 'status' },
    { name: 'comprador', type: 'text', path: 'buyer.nickname' },
  ],
  key: ['id'],
  changedSince: null,
}

/** One statement as the Projeto's read login, as the edge reaches it: the rows' count, or the SQLSTATE that refused it. */
async function asApp(on: ListProposalsOn, text: string) {
  const { readLogin } = appLogin(on.projectId)
  const url = new URL(on.owner.reveal())
  url.username = readLogin
  url.password = await appLoginPassword({ key: TEST_APP_LOGIN_KEY, login: readLogin })
  const client = new pg.Client({ connectionString: url.toString() })
  await client.connect()
  try {
    return { rows: (await client.query(text)).rowCount }
  } catch (error) {
    if (error instanceof pg.DatabaseError) return { refused: error.code }
    throw error
  } finally {
    await client.end()
  }
}

async function enabledByAna(on: ListProposalsOn) {
  const answer = await on.propose({ name: 'ml_comprador', definition: PERSONAL_COPY })
  assert.equal(answer.kind, 'PROPOSED', JSON.stringify(answer))
  const made = await on.enable(on.ana, CopyProposalId.parse(Object(answer).proposalId))
  assert.equal(made.statusCode, 201, made.body)
  const copyId = String(Object(made.json()).copy.id)
  const deadline = Date.now() + 60_000
  for (;;) {
    const read = await call(on.hub, on.ana, 'GET', `${on.copiesUrl}/${copyId}/runs`)
    const { runs } = listCopyRuns.success.body.parse(read.json())
    if (runs.some((run) => run.outcome.kind !== 'RUNNING')) return copyId
    assert.ok(Date.now() < deadline, 'the first run did not end')
    await sleep(100)
  }
}

test('a cópia guarda a coluna pessoal de quem liga com o tipo, e o Projeto liberado por quem não o tem não a lê', async (t) => {
  const on = await listProposalsOn(t)
  const copyId = await enabledByAna(on)
  const kept = await asSync(on.owner, async (client) => {
    const result = await client.query('select distinct comprador from sync.ml_comprador')
    return result.rows.map((row) => row.comprador)
  })
  assert.deepEqual(kept, [BUYER_NICKNAME], 'who turned it on holds contato: the column is kept')
  const all = await asApp(on, 'select id from sync.ml_comprador')
  assert.ok((all.rows ?? 0) > 0)
  assert.deepEqual(await asApp(on, 'select comprador from sync.ml_comprador'), all)

  const who = { name: 'Davi Costa', email: 'davi@example.test' }
  const developer = await memberOn(on.hub, on.companyId, who, 'developer')
  const release = {
    ...{ companyId: on.companyId, projectId: on.projectId, copyId: CopyId.parse(copyId) },
    personId: on.anaId,
  }
  await on.copies.revoke(release)
  await on.copies.grant({ ...release, personId: PersonId.parse(developer.id) })
  assert.deepEqual(await asApp(on, 'select comprador from sync.ml_comprador'), { refused: '42501' })
  assert.ok(((await asApp(on, 'select id, status from sync.ml_comprador')).rows ?? 0) > 0)
  assert.ok(
    ((await asApp(on, 'select _account, _account_name from sync.ml_comprador')).rows ?? 0) > 0,
    'the engine columns stay readable',
  )

  const { readLogin, runLogin } = appLogin(on.projectId)
  await asSync(on.owner, (client) =>
    client.query(`GRANT SELECT ON sync.ml_comprador TO "${readLogin}", "${runLogin}"`),
  )
  assert.ok(
    ((await asApp(on, 'select comprador from sync.ml_comprador')).rows ?? 0) > 0,
    'a release made before the step holds the whole table',
  )
  const repaired = await on.copies.applyGrants({
    companyId: on.companyId,
    projectId: on.projectId,
  })
  assert.equal(repaired.kind, 'DONE')
  assert.deepEqual(await asApp(on, 'select comprador from sync.ml_comprador'), { refused: '42501' })
  assert.ok(((await asApp(on, 'select id, status from sync.ml_comprador')).rows ?? 0) > 0)

  for (const ref of [STORE_A.ref, STORE_B.ref]) {
    const gone = await call(on.hub, on.ana, 'DELETE', `${on.base}/${on.store(ref)}`)
    assert.equal(gone.statusCode, 200, gone.body)
  }
  const left = await asSync(on.owner, async (client) => {
    const result = await client.query("select to_regclass('sync.ml_comprador')::text as table_name")
    return result.rows[0]?.table_name
  })
  assert.equal(left, null, 'the last source left: the table, and the value with it')
})
