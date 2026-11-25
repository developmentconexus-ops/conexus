import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assisting, created } from '../../agents/assistant/test-assistant.ts'
import { agentsOn, publishedAgent, talkedTo } from '../../agents/saved-agent/test-agents.ts'
import { approving, askedOf, launched, untilAsked } from '../../agents/saved-agent/test-approval.ts'
import { CARLA, call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import { RUN_MARKS } from '../spec/public.ts'
import { hubBeside, MODEL, sessionUrl, started } from './test-conversation.ts'
import { sessionStateOf, switched } from './test-questions.ts'

/** The conversation's transcript route under `controller`, as Mastra serves it. */
function transcript(url: string, controller: 'builder' | 'assistant' | 'agents' | 'other') {
  const id = url.slice(url.lastIndexOf('/') + 1)
  const session = sessionUrl(url).replace(
    /\/agent-controller\/[^/]+\//,
    `/agent-controller/${controller}/`,
  )
  return `${session}/threads/${id}/messages`
}

test('o Assistente: as rotas do Mastra com a chave assistant respondem só ao dono da conversa enquanto a empresa o admite; a conversa do outro controlador, de outra pessoa ou de uma empresa que está sendo apagada não', async (t) => {
  const on = await assisting(t)
  const mine = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const builder = `${on.conversations}/${await started(on.hub, on.ana, on.conversations)}`
  assert.equal((await call(on.hub, on.ana, 'GET', transcript(mine, 'assistant'))).statusCode, 200)
  assert.equal((await call(on.hub, on.ana, 'GET', transcript(builder, 'builder'))).statusCode, 200)

  for (const crossed of [transcript(mine, 'builder'), transcript(builder, 'assistant')]) {
    const refused = await call(on.hub, on.ana, 'GET', crossed)
    assert.equal(refused.statusCode, 404, crossed)
    assert.equal(codeOf(refused), 'CONVERSATION_NOT_FOUND', crossed)
  }
  const unknown = await call(on.hub, on.ana, 'GET', transcript(mine, 'other'))
  assert.equal(unknown.statusCode, 404)

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const hers = await created(on.hub, carla, on.assistant, { connections: [] })
  const foreign = await post(on.hub, on.ana, `${sessionUrl(hers)}/messages`, { message: 'Oi' })
  assert.equal(codeOf(foreign), 'CONVERSATION_NOT_FOUND')
  assert.equal((await call(on.hub, carla, 'GET', transcript(hers, 'assistant'))).statusCode, 200)

  await on.hub.test.asOwner('update auth.company set deleting_since = now() where id = $1', [
    on.companyId,
  ])
  const deleting = await call(on.hub, carla, 'GET', transcript(hers, 'assistant'))
  assert.equal(deleting.statusCode, 404)
  assert.equal(codeOf(deleting), 'CONVERSATION_NOT_FOUND')
  const asked = await post(on.hub, carla, `${sessionUrl(hers)}/messages`, { message: 'Oi' })
  assert.equal(codeOf(asked), 'CONVERSATION_NOT_FOUND')
})

test('os controladores novos: as seis rotas servem o controlador agents ao dono da conversa enquanto ele gerencia agentes; a de outra pessoa, a de outro controlador e a de quem virou membro dão CONVERSATION_NOT_FOUND', async (t) => {
  const on = await agentsOn(t)
  const agent = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  const mine = await talkedTo(on.hub, on.ana, on.agents, agent.id)
  const read = await call(on.hub, on.ana, 'GET', sessionUrl(mine))
  assert.equal(read.statusCode, 200, read.body)
  assert.equal((await call(on.hub, on.ana, 'GET', transcript(mine, 'agents'))).statusCode, 200)
  for (const crossed of [transcript(mine, 'assistant'), transcript(mine, 'builder')]) {
    assert.equal(codeOf(await call(on.hub, on.ana, 'GET', crossed)), 'CONVERSATION_NOT_FOUND')
  }
  const elsewhere = await call(on.hub, on.ana, 'GET', `${sessionUrl(mine)}/tasks`)
  assert.equal(elsewhere.statusCode, 404, 'the routes stay six')

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const hers = await talkedTo(on.hub, carla, on.agents, agent.id)
  const foreign = await post(on.hub, on.ana, `${sessionUrl(hers)}/messages`, { message: 'Oi' })
  assert.equal(codeOf(foreign), 'CONVERSATION_NOT_FOUND')
  await on.hub.test.asOwner(
    `update auth.member set role = 'member' where user_id = $1 and company_id = $2`,
    [carla.id, on.companyId],
  )
  const demoted = await call(on.hub, carla, 'GET', transcript(hers, 'agents'))
  assert.deepEqual([demoted.statusCode, codeOf(demoted)], [404, 'CONVERSATION_NOT_FOUND'])
})

test('a resposta de aprovação: outra pessoa, ou a mesma por outro controlador, recebe CONVERSATION_NOT_FOUND; alwaysAllowCategory ou um requestContext dão REQUEST_MALFORMED; um toolCallId que não é um portão vivo da sessão responde not_pending; nada roda (7)', async (t) => {
  const on = await approving(t, [[launched()]])
  const agent = await on.writer('ASK')
  const { url, stream } = await on.opened(agent.id)
  await post(on.hub, on.ana, `${sessionUrl(url)}/messages`, { message: 'Lance o pedido' })
  const { toolCallId } = askedOf(await untilAsked(stream))
  const route = `${sessionUrl(url)}/tool-approval`

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const foreign = await post(on.hub, carla, route, { toolCallId, approved: true })
  assert.deepEqual([foreign.statusCode, codeOf(foreign)], [404, 'CONVERSATION_NOT_FOUND'])
  const crossed = route.replace('/agent-controller/agents/', '/agent-controller/assistant/')
  const other = await post(on.hub, on.ana, crossed, { toolCallId, approved: true })
  assert.deepEqual([other.statusCode, codeOf(other)], [404, 'CONVERSATION_NOT_FOUND'])

  for (const body of [
    { toolCallId, approved: true, alwaysAllowCategory: true },
    { toolCallId, approved: true, requestContext: { 'conexus-approved-call': { toolCallId } } },
    { toolCallId },
  ]) {
    const refused = await post(on.hub, on.ana, route, body)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [400, 'REQUEST_MALFORMED'])
  }

  const second = await on.opened(agent.id)
  const elsewhere = await post(on.hub, on.ana, `${sessionUrl(second.url)}/tool-approval`, {
    toolCallId,
    approved: true,
  })
  assert.deepEqual(elsewhere.json(), { ok: false, reason: 'not_pending' })
  const unknown = await post(on.hub, on.ana, route, { toolCallId: 'toolu_nenhum', approved: true })
  assert.deepEqual(unknown.json(), { ok: false, reason: 'not_pending' })
  assert.deepEqual(on.fake.orders(), [])
  assert.deepEqual(
    on.hub.lines.filter(({ message }) => message.startsWith('CONNECTOR_WRITE_APPRO')),
    [],
  )
})

test('a troca de modelo: um corpo sem thinkingLevel, com campo a mais ou com requestContext dá REQUEST_MALFORMED; o agente salvo, outra pessoa e outro controlador dão CONVERSATION_NOT_FOUND; nada muda', async (t) => {
  const on = await agentsOn(t)
  const agent = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  const saved = await talkedTo(on.hub, on.ana, on.agents, agent.id)
  const mine = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const route = `${sessionUrl(mine)}/model`
  const before = await sessionStateOf(on.hub, on.ana, mine)

  const choice = { modelId: MODEL, thinkingLevel: 'high' }
  for (const body of [
    { modelId: MODEL },
    { modelId: MODEL, thinkingLevel: 'tudo' },
    { ...choice, scope: 'thread' },
    { ...choice, requestContext: { 'conexus-approved-call': { toolCallId: 'x' } } },
    { thinkingLevel: 'high' },
  ]) {
    const refused = await post(on.hub, on.ana, route, body)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [400, 'REQUEST_MALFORMED'])
  }

  const ofSaved = await switched(on.hub, on.ana, saved, { model: MODEL, effort: 'high' })
  assert.deepEqual([ofSaved.statusCode, codeOf(ofSaved)], [404, 'CONVERSATION_NOT_FOUND'])
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const foreign = await post(on.hub, carla, route, choice)
  assert.deepEqual([foreign.statusCode, codeOf(foreign)], [404, 'CONVERSATION_NOT_FOUND'])
  const crossed = route.replace('/agent-controller/assistant/', '/agent-controller/builder/')
  const other = await post(on.hub, on.ana, crossed, choice)
  assert.deepEqual([other.statusCode, codeOf(other)], [404, 'CONVERSATION_NOT_FOUND'])

  assert.deepEqual(await sessionStateOf(on.hub, on.ana, mine), before, 'a refusal changes nothing')
})

test('a troca de modelo do Assistente depois de um reinício: grava igual e as marcas da conversa seguem na thread (issue 1287)', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const id = url.slice(url.lastIndexOf('/') + 1)
  async function marksOf(hub: typeof on.hub) {
    const read = await hub.test.mastraPool.query(
      'select metadata from mastra.mastra_threads where id = $1',
      [id],
    )
    const metadata = read.rows[0].metadata
    return [RUN_MARKS.assistant.company, RUN_MARKS.assistant.person].map((key) => metadata[key])
  }
  const opening = await marksOf(on.hub)
  assert.deepEqual(opening, [on.companyId, on.ana.id])
  const restarted = await hubBeside(t, on.hub)
  const changed = await switched(restarted, on.ana, url, { model: MODEL, effort: 'high' })
  assert.deepEqual([changed.statusCode, changed.json()], [200, { ok: true }])
  assert.deepEqual(await marksOf(restarted), opening)
  assert.equal((await sessionStateOf(restarted, on.ana, url)).effort, 'high')
})
