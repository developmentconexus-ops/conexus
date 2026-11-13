import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { CopyProposalId, listCopyRuns } from '@conexus/hub-api'
import { call, codeOf, memberOn } from '../identity/test-hub.ts'
import type { ListProposalsOn } from './test-list-proposals.ts'
import { listProposalsOn } from './test-list-proposals.ts'
import { ordersCopy, STORE_A, STORE_B, tableOf } from './test-sources.ts'

const RUN_DEADLINE_MS = 60_000

async function proposedOn(on: ListProposalsOn, name = 'ml_pedidos') {
  const answer = await on.propose({ name })
  assert.equal(answer.kind, 'PROPOSED', JSON.stringify(answer))
  return CopyProposalId.parse(Object(answer).proposalId)
}

/** The copy's first run to end, as the route lists it. */
async function firstEnded(on: ListProposalsOn, copyId: string) {
  const deadline = Date.now() + RUN_DEADLINE_MS
  while (Date.now() < deadline) {
    const read = await call(on.hub, on.ana, 'GET', `${on.copiesUrl}/${copyId}/runs`)
    const { runs } = listCopyRuns.success.body.parse(read.json())
    const ended = runs.find((run) => run.outcome.kind !== 'RUNNING')
    if (ended !== undefined) return ended
    await sleep(100)
  }
  throw new Error(`no run of ${copyId} ended within ${RUN_DEADLINE_MS} ms`)
}

test('ligar a proposta de uma leitura de lista', async (t) => {
  const on = await listProposalsOn(t)
  const proposalId = await proposedOn(on)
  const made = await on.enable(on.ana, proposalId)
  assert.equal(made.statusCode, 201, made.body)
  const copy = Object(made.json()).copy
  assert.deepEqual(copy.projects, [{ id: on.projectId, name: 'Pedidos' }])
  assert.deepEqual(copy.mode, { kind: 'CHANGES' })
  const [stored] = await on.hub.test.asOwner(
    'select definition::text as definition, model from copies.copy where id = $1',
    [copy.id],
  )
  const [kept] = await on.hub.test.asOwner(
    `select definition::text as definition, state from copies.copy_proposal where id = $1`,
    [proposalId],
  )
  assert.equal(stored?.definition, kept?.definition, 'the same definition, byte for byte')
  assert.deepEqual([stored?.model, kept?.state], [null, 'ACCEPTED'])
  const sources = await on.hub.test.asOwner(
    'select connection_id, account_ref from copies.copy_source where copy_id = $1 order by created_at',
    [copy.id],
  )
  assert.deepEqual(sources, [
    { connection_id: on.store(STORE_A.ref), account_ref: STORE_A.ref },
    { connection_id: on.store(STORE_B.ref), account_ref: STORE_B.ref },
  ])
  assert.equal((await firstEnded(on, copy.id)).outcome.kind, 'COMPLETE')
  const rows = await tableOf(on, 'ml_pedidos')
  assert.deepEqual(
    [...new Set(rows.map(([account]) => account))],
    [STORE_A.ref, STORE_B.ref],
    'each account in the one table',
  )
  const line = on.hub.lines.find((each) => each.message === 'COPY_ENABLED')
  assert.equal(line?.fields.from, 'PROPOSAL')
})

test('ligar a proposta de uma leitura de lista: as recusas', async (t) => {
  const on = await listProposalsOn(t)
  const proposalId = await proposedOn(on)
  // A developer whose role uses another read of the connector, not the copy's.
  const who = { name: 'Davi Costa', email: 'davi@example.test' }
  const developer = await memberOn(on.hub, on.companyId, who, 'developer')
  const changed = await call(
    on.hub,
    on.ana,
    'PUT',
    `/api/companies/${on.companyId}/roles/developer`,
    {
      connectors: { 'mercado-livre': ['perguntas'] },
      unattended: false,
    },
  )
  assert.equal(changed.statusCode, 200, changed.body)
  const refused = await on.enable(developer, proposalId)
  assert.equal(codeOf(refused), 'NOT_IN_ROLE', refused.body)
  assert.equal(Object(refused.json()).operation, 'Pedidos')
  // One of its connections not ACTIVE.
  await on.hub.test.asOwner(
    `update connectors.connection set state = 'NEEDS_REAUTH' where id = $1`,
    [on.store(STORE_B.ref)],
  )
  const notReady = await on.enable(on.ana, proposalId)
  assert.equal(codeOf(notReady), 'COPY_CONNECTION_NOT_READY', notReady.body)
  const [row] = await on.proposalRows()
  assert.equal(row?.state, 'OPEN')
  assert.deepEqual(await on.hub.test.asOwner('select id from copies.copy'), [])
})

async function proposed(on: ListProposalsOn, name: string, column: object) {
  const id = { name: 'id', type: 'bigint', path: 'id' }
  const definition = { ...ordersCopy(false), columns: [id, column] }
  const answer = await on.propose({ name, definition })
  assert.equal(answer.kind, 'PROPOSED', JSON.stringify(answer))
  return CopyProposalId.parse(Object(answer).proposalId)
}

test('uma cópia não guarda documento: o Ligar recusa a coluna de documento, e liga a de contato', async (t) => {
  const on = await listProposalsOn(t)
  const cpf = { name: 'cpf', type: 'text', path: 'buyer.billing_info.doc_number' }
  const refused = await on.enable(on.ana, await proposed(on, 'ml_documento', cpf))
  assert.equal(codeOf(refused), 'COPY_PERSONAL_NOT_KEPT', refused.body)
  const nickname = { name: 'comprador', type: 'text', path: 'buyer.nickname' }
  assert.equal(
    (await on.enable(on.ana, await proposed(on, 'ml_comprador', nickname))).statusCode,
    201,
  )
})
