import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CARLA, call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import { agentsOn, publishedAgent, talkedTo } from '../agents/test-agents.ts'
import { assisting, created } from '../assistant/test-assistant.ts'
import { sessionUrl, started } from './test-conversation.ts'

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
