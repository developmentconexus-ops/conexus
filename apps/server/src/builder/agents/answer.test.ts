import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { call, memberOn, post } from '../../hub/identity/test-hub.ts'
import type { Reply } from '../../platform/test-anthropic.ts'
import { said } from '../assistant/test-assistant.ts'
import { sent } from '../conversation/test-conversation.ts'
import { untilParked } from '../conversation/test-questions.ts'
import { agentOf, drafted, publishedAgent, publishedNow } from './test-agents.ts'
import {
  answer,
  approvalsIn,
  approving,
  askedOf,
  developerHolds,
  launched,
  untilAsked,
  WRITE,
} from './test-approval.ts'

const READS = ['clientes', 'empresas', 'pedidos', 'consultar', 'carregar']
const BRUNO = { name: 'Bruno Lima', email: 'bruno@example.test' }
const BIA = { name: 'Bia Souza', email: 'bia@example.test' }
const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }

test('quem restaura responde pela versão até o fim do turno: a v3 entra no meio e a escrita seguinte da v1 ainda responde por Bruno, que perdeu a escrita, e pergunta (D2-a)', async (t) => {
  const between: { run: () => Promise<void> } = { run: () => Promise.resolve() }
  const replies: Reply[] = [
    { kind: 'blocks', blocks: [launched()] },
    { kind: 'after', until: () => between.run(), reply: { kind: 'blocks', blocks: [launched()] } },
  ]
  let step = 0
  const on = await approving(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    return replies[step++] ?? { kind: 'text', text: 'Pronto.' }
  })
  const bia = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'developer')
  await developerHolds(on, [...READS, 'lancarPedido'], true)
  const v1 = await publishedAgent(on.hub, bia, on.agents, {
    instructions: 'Lance os pedidos que a pessoa pedir.',
    connections: [on.matriz],
    tools: [on.write.latest.id],
    approvals: { [on.write.id]: 'AUTO' },
  })
  const asking = await drafted(on.hub, bruno, on.agents, v1, {
    approvals: { [on.write.id]: 'ASK' },
  })
  const v2 = await publishedNow(on.hub, bruno, on.agents, asking)
  const back = await post(on.hub, bruno, `${on.agents}/${v1.id}/versions/1/activate`, {})
  assert.equal(back.statusCode, 200, back.body)

  between.run = async () => {
    const next = await drafted(on.hub, on.ana, on.agents, v2, {
      instructions: 'Lance os pedidos que a pessoa pedir, com cuidado.',
      approvals: { [on.write.id]: 'AUTO' },
    })
    await publishedNow(on.hub, on.ana, on.agents, next)
    await developerHolds(on, READS, true)
  }
  const { url, stream } = await on.opened(v1.id)
  await sent(on.hub, on.ana, url, 'Lance dois pedidos')
  assert.equal(askedOf(await untilAsked(stream)).toolName, WRITE)
  assert.equal(on.fake.orders().length, 1, 'the card stops the second write before the Sankhya')
})

test('quem restaura sai da empresa e volta: o agente registrado deixa de ser dele, e o turno novo da v1 pergunta ainda que ele tenha de novo o papel e a ação (D2-a)', async (t) => {
  const on = await approving(t, [[launched()], [said('Lançado.')], [launched()]])
  const bia = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'developer')
  await developerHolds(on, [...READS, 'lancarPedido'], true)
  const v1 = await publishedAgent(on.hub, bia, on.agents, {
    instructions: 'Lance os pedidos que a pessoa pedir.',
    connections: [on.matriz],
    tools: [on.write.latest.id],
    approvals: { [on.write.id]: 'AUTO' },
  })
  const asking = await drafted(on.hub, bruno, on.agents, v1, {
    approvals: { [on.write.id]: 'ASK' },
  })
  await publishedNow(on.hub, bruno, on.agents, asking)
  const back = await post(on.hub, bruno, `${on.agents}/${v1.id}/versions/1/activate`, {})
  assert.equal(back.statusCode, 200, back.body)
  const { url, stream } = await on.opened(v1.id)
  await sent(on.hub, on.ana, url, 'Lance o pedido')
  assert.deepEqual(approvalsIn(await stream.turn()), [], 'Bruno answers, no card')
  assert.equal(on.fake.orders().length, 1)

  const gone = await call(on.hub, on.ana, 'DELETE', `${on.company}/members/${bruno.id}`)
  assert.equal(gone.statusCode, 204, gone.body)
  await on.hub.test.asOwner(
    `insert into auth.member (id, company_id, user_id, role, created_at)
      values ($1, $2, $3, 'developer', now())`,
    [randomUUID(), on.companyId, bruno.id],
  )
  await sent(on.hub, on.ana, url, 'Lance outro')
  assert.equal(askedOf(await untilAsked(stream)).toolName, WRITE)
  assert.equal(on.fake.orders().length, 1, 'no one answers for the version, so the card stops it')
})

test('quem publica de novo a revisão responde pela versão: quem a pôs ativa por último perde a ação e a escrita em Faz sozinho volta a perguntar (D2-a)', async (t) => {
  const on = await approving(t, [[launched()], [said('Lançado.')], [launched()]])
  const bia = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'admin')
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'developer')
  await developerHolds(on, [...READS, 'lancarPedido'], true)
  const v1 = await publishedAgent(on.hub, bia, on.agents, {
    instructions: 'Lance os pedidos que a pessoa pedir.',
    connections: [on.matriz],
    tools: [on.write.latest.id],
    approvals: { [on.write.id]: 'AUTO' },
  })
  const second = await drafted(on.hub, bia, on.agents, v1, {
    instructions: 'Lance os pedidos que a pessoa pedir, com calma.',
  })
  await publishedNow(on.hub, bia, on.agents, second)
  const back = await post(on.hub, bruno, `${on.agents}/${v1.id}/versions/1/activate`, {})
  assert.equal(back.statusCode, 200, back.body)

  const again = await post(on.hub, carla, `${on.agents}/${v1.id}/publish`, {
    revision: second.revision,
    message: '',
  })
  assert.equal(again.statusCode, 200, again.body)
  assert.deepEqual(agentOf(await call(on.hub, on.ana, 'GET', `${on.agents}/${v1.id}`)).state, {
    kind: 'PUBLISHED',
    version: 2,
    changed: false,
  })

  const { url, stream } = await on.opened(v1.id)
  await sent(on.hub, on.ana, url, 'Lance o pedido')
  assert.deepEqual(approvalsIn(await stream.turn()), [], 'Carla answers and holds the action')
  assert.equal(on.fake.orders().length, 1)

  await developerHolds(on, READS, true)
  await sent(on.hub, on.ana, url, 'Lance outro')
  assert.equal(askedOf(await untilAsked(stream)).toolName, WRITE)
  assert.equal(on.fake.orders().length, 1, 'the card stops the write before the Sankhya')
})

test('um cartão aberto fixa o turno na versão em que começou: a v2 entra em Faz sozinho com o cartão esperando, e o Aprovar roda a v1, que pergunta de novo; o turno seguinte roda a v2 (retomada fixada)', async (t) => {
  const on = await approving(t, [
    [launched()],
    [launched()],
    [said('Lançados.')],
    [launched()],
    [said('Lançado.')],
  ])
  const v1 = await on.writer('ASK')
  const { url, stream } = await on.opened(v1.id)
  await sent(on.hub, on.ana, url, 'Lance dois pedidos')
  const first = askedOf(await untilAsked(stream))

  const alone = await drafted(on.hub, on.ana, on.agents, v1, {
    approvals: { [on.write.id]: 'AUTO' },
  })
  await publishedNow(on.hub, on.ana, on.agents, alone)
  assert.deepEqual(await answer(on.hub, on.ana, url, first.toolCallId, true), { ok: true })
  const second = askedOf(await untilAsked(stream))
  assert.equal(on.fake.orders().length, 1, 'the approved call ran, and the v1 asks again')

  assert.deepEqual(await answer(on.hub, on.ana, url, second.toolCallId, true), { ok: true })
  assert.deepEqual(approvalsIn(await stream.turn()), [])
  assert.equal(on.fake.orders().length, 2)

  await sent(on.hub, on.ana, url, 'Lance mais um')
  assert.deepEqual(
    approvalsIn(await stream.turn()),
    [],
    'the next turn runs the v2, which runs alone',
  )
  assert.equal(on.fake.orders().length, 3)
})

test('quem saiu da empresa com o cartão esperando: a versão nova entra em Faz sozinho, e depois do Aprovar a escrita seguinte ainda é de quem ativou a v1, que não tem mais papel, e pergunta (D2-a, retomada fixada)', async (t) => {
  const on = await approving(t, [[launched()], [launched()], [said('Lançados.')]])
  const bia = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'developer')
  await developerHolds(on, [...READS, 'lancarPedido'], true)
  const v1 = await publishedAgent(on.hub, bia, on.agents, {
    instructions: 'Lance os pedidos que a pessoa pedir.',
    connections: [on.matriz],
    tools: [on.write.latest.id],
    approvals: { [on.write.id]: 'AUTO' },
  })
  const asking = await drafted(on.hub, bruno, on.agents, v1, {
    approvals: { [on.write.id]: 'ASK' },
  })
  const v2 = await publishedNow(on.hub, bruno, on.agents, asking)
  const back = await post(on.hub, bruno, `${on.agents}/${v1.id}/versions/1/activate`, {})
  assert.equal(back.statusCode, 200, back.body)
  await developerHolds(on, READS, true)

  const { url, stream } = await on.opened(v1.id)
  await sent(on.hub, on.ana, url, 'Lance dois pedidos')
  const first = askedOf(await untilAsked(stream))

  await developerHolds(on, [...READS, 'lancarPedido'], true)
  const next = await drafted(on.hub, on.ana, on.agents, v2, {
    instructions: 'Lance os pedidos que a pessoa pedir, com cuidado.',
    approvals: { [on.write.id]: 'AUTO' },
  })
  await publishedNow(on.hub, on.ana, on.agents, next)
  const gone = await call(on.hub, on.ana, 'DELETE', `${on.company}/members/${bruno.id}`)
  assert.equal(gone.statusCode, 204, gone.body)

  assert.deepEqual(await answer(on.hub, on.ana, url, first.toolCallId, true), { ok: true })
  assert.equal(askedOf(await untilAsked(stream)).toolName, WRITE)
  assert.equal(
    on.fake.orders().length,
    1,
    'no one answers for the v1 now, so the card stops the second',
  )
})

test('quem ativou a v1 ainda tem a ação quando o cartão é respondido: a v2 em Pergunta antes entra no intervalo, e a escrita seguinte, em Faz sozinho, roda sem cartão (retomada fixada)', async (t) => {
  const on = await approving(t, [[launched()], [launched()], [said('Lançados.')]])
  const bia = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'developer')
  await developerHolds(on, [...READS, 'lancarPedido'], true)
  const v1 = await publishedAgent(on.hub, bia, on.agents, {
    instructions: 'Lance os pedidos que a pessoa pedir.',
    connections: [on.matriz],
    tools: [on.write.latest.id],
    approvals: { [on.write.id]: 'AUTO' },
  })
  const asking = await drafted(on.hub, bruno, on.agents, v1, {
    approvals: { [on.write.id]: 'ASK' },
  })
  const v2 = await publishedNow(on.hub, bruno, on.agents, asking)
  const back = await post(on.hub, bruno, `${on.agents}/${v1.id}/versions/1/activate`, {})
  assert.equal(back.statusCode, 200, back.body)
  await developerHolds(on, READS, true)

  const { url, stream } = await on.opened(v1.id)
  await sent(on.hub, on.ana, url, 'Lance dois pedidos')
  const first = askedOf(await untilAsked(stream))

  await developerHolds(on, [...READS, 'lancarPedido'], true)
  const next = await drafted(on.hub, on.ana, on.agents, v2, {
    instructions: 'Lance os pedidos que a pessoa pedir, com cuidado.',
  })
  await publishedNow(on.hub, on.ana, on.agents, next)

  assert.deepEqual(await answer(on.hub, on.ana, url, first.toolCallId, true), { ok: true })
  assert.deepEqual(approvalsIn(await stream.turn()), [], 'Bruno answers the v1 and holds the write')
  assert.equal(on.fake.orders().length, 2)
})

test('um cartão parado antes de a ativação existir retoma na versão de agora: o snapshot sem a chave não falha', async (t) => {
  const on = await approving(t, [[launched()], [launched()], [said('Lançados.')]])
  const v1 = await on.writer('ASK')
  const { url, stream } = await on.opened(v1.id)
  await sent(on.hub, on.ana, url, 'Lance dois pedidos')
  const first = askedOf(await untilAsked(stream))
  await untilParked(on.hub)
  await on.hub.test.mastraPool.query(
    `update mastra.mastra_workflow_snapshot
        set snapshot = snapshot #- '{requestContext,conexus-agent-activation}'
      where snapshot->>'status' = 'suspended'`,
  )
  const alone = await drafted(on.hub, on.ana, on.agents, v1, {
    approvals: { [on.write.id]: 'AUTO' },
  })
  await publishedNow(on.hub, on.ana, on.agents, alone)

  assert.deepEqual(await answer(on.hub, on.ana, url, first.toolCallId, true), { ok: true })
  assert.deepEqual(approvalsIn(await stream.turn()), [], 'without the key the v2 runs the rest')
  assert.equal(on.fake.orders().length, 2)
})
