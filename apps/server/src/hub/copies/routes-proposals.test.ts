import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { call, codeOf } from '../identity/test-hub.ts'
import { copiesOn } from './test-copies.ts'
import { listProposalsOn } from './test-list-proposals.ts'
import { definitionOf, dismiss, grantMatriz, listedBy, proposed } from './test-proposals.ts'
import { copiesUrl } from './test-routes.ts'
import { ordersCopy, STORE_A, STORE_B } from './test-sources.ts'

test('a lista com as propostas', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const definition = definitionOf(on)
  const open = await proposed(on)
  const gone = await proposed(on, 'sankhya_dispensada')
  assert.equal((await dismiss(on, on.ana, gone)).statusCode, 200)
  const { proposals } = await listedBy(on, on.ana)
  assert.deepEqual(
    proposals.map((each) => [each.id, each.state]),
    [[open, 'OPEN']],
  )
  const [one] = proposals
  assert.ok(one)
  assert.deepEqual(
    { ...one, proved: { ...one.proved, rows: one.proved.rows > 0 } },
    {
      id: open,
      name: 'sankhya_devolucoes',
      label: 'Devoluções',
      sources: [{ connection: { id: on.connectionId, name: 'Matriz', connector: 'sankhya' } }],
      project: { id: on.projectId, name: 'Pedidos' },
      shown: {
        source: { kind: 'QUERY', query: definition.source.sql },
        key: definition.key,
        changedSince: definition.changedSince,
        window: definition.window ?? null,
        description: definition.description ?? null,
        columns: definition.columns.map((c) => ({
          ...c,
          description: c.description ?? null,
          inactiveSince: null,
        })),
      },
      mode: { kind: 'WINDOW', days: definition.window?.days },
      proved: { rows: true, more: one.proved.more, calls: null },
      proposedBy: { id: on.ana.id, name: 'Ana Lima' },
      state: 'OPEN',
    },
  )
  const named = await listedBy(on, on.ana, [gone])
  assert.deepEqual(
    named.proposals.map((each) => [each.id, each.state]).sort(),
    [
      [open, 'OPEN'],
      [gone, 'DISMISSED'],
    ].sort(),
  )
  const tooMany = Array.from({ length: 21 }, () => randomUUID())
  const refused = await call(on.hub, on.ana, 'GET', `${copiesUrl(on)}?proposalId=${tooMany}`)
  assert.equal(refused.statusCode, 400, refused.body)
  for (const notUuid of ['-'.repeat(36), 'abc', `${open},`, '']) {
    const bad = await call(on.hub, on.ana, 'GET', `${copiesUrl(on)}?proposalId=${notUuid}`)
    assert.equal(bad.statusCode, 400, `${notUuid}: ${bad.body}`)
    assert.equal(codeOf(bad), 'REQUEST_MALFORMED', bad.body)
  }
})

test('a lista com a origem', async (t) => {
  const on = await listProposalsOn(t)
  const answer = await on.propose()
  assert.equal(answer.kind, 'PROPOSED', JSON.stringify(answer))
  const connector = 'mercado-livre'
  const sources = [STORE_A, STORE_B].map((store, at) => {
    return { connection: { id: on.store(store.ref), name: `Loja ${'AB'[at]}`, connector } }
  })
  const shown = {
    source: { kind: 'OPERATION', operation: 'pedidos', label: 'Pedidos', input: {} },
    key: ['id'],
    changedSince: { column: 'atualizado' },
    window: null,
    description: 'Os pedidos de cada loja',
    columns: ordersCopy(true).columns.map(({ name, type, description }) => {
      return { name, type, description: description ?? null, inactiveSince: null }
    }),
  }
  const [proposal] = (await on.listed(on.ana)).proposals
  assert.deepEqual(
    [proposal?.sources, proposal?.shown, proposal?.proved],
    [sources, shown, { rows: 50, more: true, calls: 6 }],
  )
  const made = await on.enable(on.ana, Object(answer).proposalId)
  assert.equal(made.statusCode, 201, made.body)
  const [copy] = (await on.listed(on.ana)).copies
  assert.deepEqual([copy?.sources, copy?.shown], [sources, shown])
})
