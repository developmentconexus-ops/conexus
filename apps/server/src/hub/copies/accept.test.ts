import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { call, codeOf, memberOn } from '../identity/test-hub.ts'
import type { CopiesOn } from './test-copies.ts'
import { asSync, copiesOn } from './test-copies.ts'
import {
  definitionOf,
  dismiss,
  enableProposal,
  grantMatriz,
  proposalRows,
  proposed,
} from './test-proposals.ts'
import { firstEnded, runsPage } from './test-routes.ts'

/** A developer whose role reads no operation of the connection's read door. */
async function developerWithoutReads(on: CopiesOn) {
  const who = { name: 'Davi Costa', email: 'davi@example.test' }
  const developer = await memberOn(on.hub, on.companyId, who, 'developer')
  const url = `/api/companies/${on.companyId}/roles/developer`
  const changed = await call(on.hub, on.ana, 'PUT', url, {
    connectors: { sankhya: ['pedidos'] },
    unattended: false,
  })
  assert.equal(changed.statusCode, 200, changed.body)
  return developer
}

test('ligar a proposta libera ao Projeto', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const definition = definitionOf(on)
  const proposalId = await proposed(on)
  const key = randomUUID()
  const made = await enableProposal(on, on.ana, proposalId, key)
  assert.equal(made.statusCode, 201, made.body)
  const copy = Object(made.json()).copy
  assert.equal(copy.name, 'devolucoes')
  assert.deepEqual(copy.projects, [{ id: on.projectId, name: 'Pedidos' }])
  assert.deepEqual(copy.mode, { kind: 'WINDOW', days: definition.window?.days })
  assert.equal(copy.interval, '1h')
  const [row] = await proposalRows(on)
  assert.equal(row.state, 'ACCEPTED')
  assert.equal(row.copy_id, copy.id)
  const stored = await on.hub.test.asOwner(
    'select definition::text as definition, model from copies.copy where id = $1',
    [copy.id],
  )
  const kept = await on.hub.test.asOwner(
    'select definition::text as definition from copies.copy_proposal where id = $1',
    [proposalId],
  )
  assert.equal(stored[0]?.definition, kept[0]?.definition, 'the same definition, byte for byte')
  assert.equal(stored[0]?.model, null)
  // The Projeto's login may read the copy's table: the GRANT followed.
  const granted = await asSync(on.owner, (client) =>
    client.query(
      `select count(*)::int as n from information_schema.role_table_grants
        where table_schema = 'sync' and table_name = 'devolucoes' and privilege_type = 'SELECT'`,
    ),
  )
  assert.ok(Number(granted.rows[0]?.n) > 0, 'a SELECT grant on sync.devolucoes')
  // The first run starts.
  assert.equal((await firstEnded(on, copy.id)).outcome.kind, 'COMPLETE')
  const again = await enableProposal(on, on.ana, proposalId, key)
  assert.equal(again.statusCode, 201, again.body)
  assert.equal(Object(again.json()).copy.id, copy.id)
  const line = on.hub.lines.find((each) => each.message === 'COPY_ENABLED')
  assert.equal(line?.fields.from, 'PROPOSAL')
})

test('dois cliques em duas abas', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const proposalId = await proposed(on)
  const [first, second] = await Promise.all([
    enableProposal(on, on.ana, proposalId),
    enableProposal(on, on.ana, proposalId),
  ])
  const answers = [first, second].map((each) => each.statusCode).sort()
  const failed = on.hub.lines.filter((each) => each.message.endsWith('_FAILED'))
  assert.deepEqual(answers, [201, 409], `${first?.body} ${second?.body} ${JSON.stringify(failed)}`)
  const late = first?.statusCode === 409 ? first : second
  assert.ok(late)
  assert.equal(codeOf(late), 'COPY_PROPOSAL_DECIDED')
  const copies = await on.hub.test.asOwner('select id from copies.copy')
  assert.equal(copies.length, 1)
  const other = await proposed(on, 'outra')
  assert.equal((await dismiss(on, on.ana, other)).statusCode, 200)
  const dismissed = await enableProposal(on, on.ana, other)
  assert.equal(dismissed.statusCode, 409, dismissed.body)
  assert.equal(codeOf(dismissed), 'COPY_PROPOSAL_DECIDED')
})

test('o GRANT falha e a mesma chave retoma: uma rodada e um COPY_ENABLED', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const proposalId = await proposed(on)
  const key = randomUUID()
  const silent = t.mock.method(on.hub.postgres.companyPostgres, 'grantCopy', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  const failed = await enableProposal(on, on.ana, proposalId, key)
  assert.deepEqual([failed.statusCode, codeOf(failed)], [503, 'COPY_DATABASE_UNAVAILABLE'])
  silent.mock.restore()
  const retried = await enableProposal(on, on.ana, proposalId, key)
  assert.equal(retried.statusCode, 201, retried.body)
  const again = await enableProposal(on, on.ana, proposalId, key)
  assert.equal(again.statusCode, 201, again.body)
  const copyId = Object(retried.json()).copy.id
  await firstEnded(on, copyId)
  assert.equal((await runsPage(on, on.ana, copyId)).runs.length, 1, 'uma rodada')
  assert.equal(on.hub.lines.filter((each) => each.message === 'COPY_ENABLED').length, 1)
})

test('a mesma chave ao mesmo tempo dá a mesma cópia', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  // The Projeto's database exists already, so only the Hub's lock is left to race on.
  assert.equal((await enableProposal(on, on.ana, await proposed(on, 'antes'))).statusCode, 201)
  const proposalId = await proposed(on)
  const key = randomUUID()
  const [first, second] = await Promise.all([
    enableProposal(on, on.ana, proposalId, key),
    enableProposal(on, on.ana, proposalId, key),
  ])
  const failed = on.hub.lines.filter((each) => each.message.endsWith('_FAILED'))
  assert.deepEqual(
    [first.statusCode, second.statusCode],
    [201, 201],
    `${first.body} ${second.body} ${JSON.stringify(failed)}`,
  )
  assert.equal(Object(first.json()).copy.id, Object(second.json()).copy.id)
  assert.equal((await on.hub.test.asOwner('select id from copies.copy')).length, 2)
})

test('quem liga precisa poder ler', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const proposalId = await proposed(on)
  const developer = await developerWithoutReads(on)
  const refused = await enableProposal(on, developer, proposalId)
  assert.equal(codeOf(refused), 'NOT_IN_ROLE', refused.body)
  assert.equal(Object(refused.json()).operation, 'Consulta')
  const member = await enableProposal(on, on.carla, proposalId)
  assert.equal(member.statusCode, 404, member.body)
  assert.equal(codeOf(member), 'NOT_FOUND')
  assert.equal((await proposalRows(on))[0]?.state, 'OPEN')
  const unknown = await enableProposal(on, on.ana, randomUUID())
  assert.equal(codeOf(unknown), 'NOT_FOUND')
})

test('dispensar', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const proposalId = await proposed(on)
  const first = await dismiss(on, on.ana, proposalId)
  assert.equal(first.statusCode, 200, first.body)
  assert.equal((await proposalRows(on))[0]?.state, 'DISMISSED')
  const repeated = await dismiss(on, on.ana, proposalId)
  assert.equal(repeated.statusCode, 200, repeated.body)
  assert.equal(on.hub.lines.filter((each) => each.message === 'COPY_PROPOSAL_DISMISSED').length, 1)
  assert.equal(codeOf(await dismiss(on, on.carla, proposalId)), 'NOT_FOUND')
  const accepted = await proposed(on, 'aceita')
  assert.equal((await enableProposal(on, on.ana, accepted)).statusCode, 201)
  const late = await dismiss(on, on.ana, accepted)
  assert.equal(late.statusCode, 409, late.body)
  assert.equal(codeOf(late), 'COPY_PROPOSAL_DECIDED')
})
