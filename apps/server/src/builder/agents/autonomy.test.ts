import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { operationLabel } from '../../hub/connectors/public.ts'
import type { Person } from '../../hub/identity/test-hub.ts'
import { call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import { said } from '../assistant/test-assistant.ts'
import { endOf, sent, sessionUrl, streamOf } from '../conversation/test-conversation.ts'
import { agentOf, drafted, publishedAgent, publishedNow, talkedTo } from './test-agents.ts'
import {
  answer,
  approvalsIn,
  approving,
  askedOf,
  launched,
  PERSON_PACE_MS,
  untilAsked,
  WRITE,
} from './test-approval.ts'

const READS = ['clientes', 'empresas', 'pedidos', 'consultar', 'carregar']
const BRUNO = { name: 'Bruno Lima', email: 'bruno@example.test' }
const BIA = { name: 'Bia Souza', email: 'bia@example.test' }
const DORA = { name: 'Dora Reis', email: 'dora@example.test' }

type On = Awaited<ReturnType<typeof approving>>

/** The developer role's connector operations, and whether it publishes a write that runs alone, set by Ana. */
async function developerHolds(on: On, operations: readonly string[], unattended?: boolean) {
  const role = await call(on.hub, on.ana, 'PUT', `${on.company}/roles/developer`, {
    connectors: { sankhya: operations },
    ...(unattended === undefined ? {} : { unattended }),
  })
  assert.equal(role.statusCode, 200, role.body)
}

/**
 * Bia, an administrator, publishes the write in Faz sozinho; Ana's first call runs without a card.
 * Then `change` takes something from Bia, and Ana's next call asks: the Sankhya gets nothing until
 * Ana's Aprovar.
 */
async function askedAfter(t: TestContext, change: (on: On, bia: Person) => Promise<void>) {
  const on = await approving(t, [
    [launched()],
    [said('Lançado.')],
    [launched()],
    [said('Lançado.')],
  ])
  const bia = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const agent = await publishedAgent(on.hub, bia, on.agents, {
    instructions: 'Lance os pedidos que a pessoa pedir.',
    connections: [on.matriz],
    tools: [on.write.latest.id],
    approvals: { [on.write.id]: 'AUTO' },
  })
  const { url, stream } = await on.opened(agent.id)
  await sent(on.hub, on.ana, url, 'Lance o pedido')
  assert.deepEqual(approvalsIn(await stream.turn()), [], 'published in Faz sozinho, no card')
  assert.equal(on.fake.orders().length, 1)

  await change(on, bia)
  await sent(on.hub, on.ana, url, 'Lance outro')
  const asked = askedOf(await untilAsked(stream))
  assert.equal(asked.toolName, WRITE)
  assert.equal(on.fake.orders().length, 1, 'the card stops the write before the Sankhya')
  assert.deepEqual(await answer(on.hub, on.ana, url, asked.toolCallId, true), { ok: true })
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.equal(on.fake.orders().length, 2)
}

test('quem publicou perde a ação: a escrita em Faz sozinho volta a perguntar na chamada seguinte, e só o Aprovar a envia (D2-a)', async (t) => {
  await askedAfter(t, async (on, bia) => {
    await developerHolds(on, [...READS, 'lancarPedido'])
    const demoted = await call(on.hub, on.ana, 'PUT', `${on.company}/members/${bia.id}`, {
      role: 'developer',
      from: 'admin',
    })
    assert.equal(demoted.statusCode, 200, demoted.body)
  })
})

test('quem publicou perde a ação e a escrita no papel: a escrita em Faz sozinho volta a perguntar (D2-a)', async (t) => {
  await askedAfter(t, async (on, bia) => {
    await developerHolds(on, READS)
    const demoted = await call(on.hub, on.ana, 'PUT', `${on.company}/members/${bia.id}`, {
      role: 'developer',
      from: 'admin',
    })
    assert.equal(demoted.statusCode, 200, demoted.body)
  })
})

test('quem publicou sai da empresa: a escrita em Faz sozinho volta a perguntar (D2-a)', async (t) => {
  await askedAfter(t, async (on, bia) => {
    const gone = await call(on.hub, on.ana, 'DELETE', `${on.company}/members/${bia.id}`)
    assert.equal(gone.statusCode, 204, gone.body)
  })
})

test('quem publicou guarda a ação e perde a escrita no papel: a escrita em Faz sozinho volta a perguntar (D2-a)', async (t) => {
  const on = await approving(t, [[launched()], [said('Lançado.')], [launched()]])
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'developer')
  await developerHolds(on, [...READS, 'lancarPedido'], true)
  const agent = await publishedAgent(on.hub, bruno, on.agents, {
    instructions: 'Lance os pedidos que a pessoa pedir.',
    connections: [on.matriz],
    tools: [on.write.latest.id],
    approvals: { [on.write.id]: 'AUTO' },
  })
  const { url, stream } = await on.opened(agent.id)
  await sent(on.hub, on.ana, url, 'Lance o pedido')
  assert.deepEqual(approvalsIn(await stream.turn()), [], 'published in Faz sozinho, no card')
  assert.equal(on.fake.orders().length, 1)

  await developerHolds(on, READS, true)
  await sent(on.hub, on.ana, url, 'Lance outro')
  assert.equal(askedOf(await untilAsked(stream)).toolName, WRITE)
  assert.equal(on.fake.orders().length, 1, 'the card stops the write before the Sankhya')
})

/** The agent's active version, as its page reads it. */
async function activeVersion(on: On, agentId: string) {
  return agentOf(await call(on.hub, on.ana, 'GET', `${on.agents}/${agentId}`)).state
}

test('restaurar é publicar: trazer de volta uma versão com escrita em Faz sozinho, por quem não tem a ação, dá NOT_IN_ROLE e a versão ativa não muda (opção A)', async (t) => {
  const on = await approving(t, [])
  const dora = await memberOn(on.hub, on.companyId, DORA, 'developer')
  await developerHolds(on, [...READS, 'lancarPedido'])
  const v1 = await on.writer('AUTO')
  const asking = await drafted(on.hub, on.ana, on.agents, v1, {
    approvals: { [on.write.id]: 'ASK' },
  })
  await publishedNow(on.hub, on.ana, on.agents, asking)

  const refused = await post(on.hub, dora, `${on.agents}/${v1.id}/versions/1/activate`, {})
  assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'NOT_IN_ROLE'], refused.body)
  assert.equal(Object(refused.json()).operation, operationLabel('sankhya', 'lancarPedido'))
  assert.deepEqual(await activeVersion(on, v1.id), {
    kind: 'PUBLISHED',
    version: 2,
    changed: false,
  })

  const back = await post(on.hub, on.ana, `${on.agents}/${v1.id}/versions/1/activate`, {})
  assert.equal(back.statusCode, 200, back.body)
  const line = on.hub.lines.findLast((each) => each.message === 'AGENT_ACTIVATED')
  assert.deepEqual([line?.fields.version, line?.fields.by], [1, on.ana.id])
})

test('restaurar é publicar: trazer de volta uma versão com uma operação fora do papel de quem restaura dá NOT_IN_ROLE e a versão ativa não muda (opção A)', async (t) => {
  const on = await approving(t, [])
  const dora = await memberOn(on.hub, on.companyId, DORA, 'developer')
  await developerHolds(on, READS)
  const v1 = await on.writer('ASK')
  const bare = await drafted(on.hub, on.ana, on.agents, v1, { tools: [], approvals: {} })
  await publishedNow(on.hub, on.ana, on.agents, bare)

  const refused = await post(on.hub, dora, `${on.agents}/${v1.id}/versions/1/activate`, {})
  assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'NOT_IN_ROLE'], refused.body)
  assert.equal(Object(refused.json()).operation, operationLabel('sankhya', 'lancarPedido'))
  assert.deepEqual(await activeVersion(on, v1.id), {
    kind: 'PUBLISHED',
    version: 2,
    changed: false,
  })
})

test('publicar de novo a revisão de uma versão é trazê-la de volta: com a escrita em Faz sozinho, por quem não tem a ação, dá NOT_IN_ROLE e a versão ativa não muda (opção A)', async (t) => {
  const on = await approving(t, [])
  const dora = await memberOn(on.hub, on.companyId, DORA, 'developer')
  await developerHolds(on, [...READS, 'lancarPedido'])
  const v1 = await on.writer('ASK')
  const alone = await drafted(on.hub, on.ana, on.agents, v1, {
    approvals: { [on.write.id]: 'AUTO' },
  })
  await publishedNow(on.hub, on.ana, on.agents, alone)
  const back = await post(on.hub, on.ana, `${on.agents}/${v1.id}/versions/1/activate`, {})
  assert.equal(back.statusCode, 200, back.body)

  const refused = await post(on.hub, dora, `${on.agents}/${v1.id}/publish`, {
    revision: alone.revision,
    message: '',
  })
  assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'NOT_IN_ROLE'], refused.body)
  assert.deepEqual(await activeVersion(on, v1.id), { kind: 'PUBLISHED', version: 1, changed: true })
})

test('quem aprova precisa ter a escrita no próprio papel: o Aprovar de quem não a tem dá NOT_IN_ROLE e nada chega ao Sankhya (D3-a)', async (t) => {
  const on = await approving(t, [[launched()], [said('Não lancei.')]])
  const dora = await memberOn(on.hub, on.companyId, DORA, 'developer')
  await developerHolds(on, READS)
  const agent = await on.writer('ASK')
  const url = await talkedTo(on.hub, dora, on.agents, agent.id)
  const stream = await streamOf(on.hub, dora, url)
  t.after(() => stream.close())
  await sent(on.hub, dora, url, 'Lance o pedido')
  const asked = askedOf(await untilAsked(stream))

  await sleep(PERSON_PACE_MS)
  const refused = await post(on.hub, dora, `${sessionUrl(url)}/tool-approval`, {
    toolCallId: asked.toolCallId,
    approved: true,
  })
  assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'NOT_IN_ROLE'], refused.body)
  assert.equal(Object(refused.json()).operation, operationLabel('sankhya', 'lancarPedido'))
  assert.deepEqual(await answer(on.hub, dora, url, asked.toolCallId, false), { ok: true })
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.deepEqual(on.fake.orders(), [], 'nothing reached the Sankhya')
  assert.equal(on.hub.lines.filter((line) => line.message === 'CONNECTOR_WRITE_APPROVED').length, 0)
})
