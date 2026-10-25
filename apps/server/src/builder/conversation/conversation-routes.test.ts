import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { ANA, call, codeOf, post } from '../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { conversing, messagesOf, sent, sessionUrl, started, streamOf } from './test-conversation.ts'
import { answered, ask, conversingWith, untilCard, untilParked, WHO } from './test-questions.ts'

test('só a lista fixa do Mastra: o resto é 404, sem sessão 401, um requestContext ou include do navegador 400, multipart 415, e outra thread 404', async (t) => {
  const { hub, ana, conversations, anthropic } = await conversing(t, () => ({
    kind: 'text',
    text: 'ok',
  }))
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const session = sessionUrl(url)
  const other = `${conversations}/${await started(hub, ana, conversations)}`
  const otherId = other.slice(other.lastIndexOf('/') + 1)

  for (const path of [
    '/api/builder/agent-controller',
    '/api/builder/agent-controller/builder',
    '/api/builder/agent-controller/builder/active-runs',
    `${session}/state`,
    '/api/builder/agents',
    '/api/agents',
  ]) {
    assert.equal((await call(hub, ana, 'GET', path)).statusCode, 404, path)
  }
  const model = await post(hub, ana, `${session}/model`, { modelId: 'openai/gpt-5' })
  assert.equal(model.statusCode, 404)
  const elsewhere = session.replace('/agent-controller/builder/', '/agent-controller/other/')
  assert.equal(
    codeOf(await post(hub, ana, `${elsewhere}/messages`, { message: 'Oi' })),
    'CONVERSATION_NOT_FOUND',
  )
  const foreign = await call(hub, ana, 'GET', `${session}/threads/${otherId}/messages`)
  assert.equal(codeOf(foreign), 'CONVERSATION_NOT_FOUND')

  const anonymous = await hub.app.inject({
    method: 'POST',
    url: `${session}/messages`,
    headers: { origin: TEST_ORIGIN },
    payload: { message: 'Oi' },
  })
  assert.equal(anonymous.statusCode, 401)
  assert.equal(codeOf(anonymous), 'SESSION_REQUIRED')

  const spoofed = { message: 'Oi', requestContext: { mastra__messageAuthor: { id: 'outra' } } }
  const inBody = await post(hub, ana, `${session}/messages`, spoofed)
  assert.equal(inBody.statusCode, 400)
  assert.equal(codeOf(inBody), 'REQUEST_MALFORMED')
  const inQuery = await call(
    hub,
    ana,
    'GET',
    `${session}/threads/${url.slice(url.lastIndexOf('/') + 1)}/messages?requestContext=e30`,
  )
  assert.equal(codeOf(inQuery), 'REQUEST_MALFORMED')
  const id = url.slice(url.lastIndexOf('/') + 1)
  const included = `${session}/threads/${id}/messages?include=${encodeURIComponent('[{"id":"m","threadId":"t"}]')}`
  assert.equal(codeOf(await call(hub, ana, 'GET', included)), 'REQUEST_MALFORMED')
  const boundary = 'conexus'
  const multipart = await hub.app.inject({
    method: 'POST',
    url: `${session}/messages`,
    headers: {
      origin: TEST_ORIGIN,
      cookie: ana.cookie,
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
    payload: `--${boundary}\r\nContent-Disposition: form-data; name="message"\r\n\r\nOi\r\n--${boundary}--\r\n`,
  })
  assert.equal(multipart.statusCode, 415)
  assert.deepEqual(anthropic.sent, [], 'no refused route reached the model')
})

test('a mensagem leva a pessoa da sessão como autora', async (t) => {
  const { hub, ana, conversations } = await conversing(t, (asked) => ({
    kind: 'text',
    text: asked.stream ? 'Resposta' : 'Título',
  }))
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 200)
  await stream.turn()
  const [mine] = (await messagesOf(hub, ana, url)).filter((message) => message.role === 'person')
  assert.ok(mine !== undefined)
  const read = await call(
    hub,
    ana,
    'GET',
    `${sessionUrl(url)}/threads/${url.slice(url.lastIndexOf('/') + 1)}/messages`,
  )
  const kept = Object(read.json()).messages.find(
    (message: { id: string }) => message.id === mine.id,
  )
  assert.deepEqual(kept.content.providerMetadata.mastra.author, { id: ana.id, name: ANA.name })
})

test('o cartão respondido duas vezes: a segunda o Mastra recusa, e o Builder segue uma vez', async (t) => {
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 200)
  const { card } = await untilCard(stream, 'question')
  await untilParked(hub)
  const answer = { kind: 'answers', answers: ['Todos (recomendado)'] }
  const first = await answered(hub, ana, url, card.toolCallId, answer)
  assert.deepEqual([first.statusCode, first.json()], [200, { ok: true }])
  const again = await answered(hub, ana, url, card.toolCallId, answer)
  assert.deepEqual(again.json(), { ok: false, reason: 'no_pending_suspension' })
  await stream.turn()
  assert.equal(calls.length, 2, 'the question, then one answer')
  const unknown = await answered(hub, ana, url, randomUUID(), answer)
  assert.deepEqual(unknown.json(), { ok: false, reason: 'no_pending_suspension' })
})
