import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RequestContext } from '@mastra/core/request-context'
import { controllerIn, conversationRun } from './public.ts'

const SESSION = '0194f0a2-6b1c-7d3e-8f40-5a6b7c8d9e01'
const RESOURCE = 'company:c:person:p'

function contextOf(controller: unknown) {
  return new RequestContext<unknown>([['controller', controller]])
}

test('o controller nativo de uma conversa nova, com threadId nulo e modelo vazio, ainda dá a sessão, o recurso e o estado', () => {
  const state = { get: () => 7 }
  const read = controllerIn(
    contextOf({
      sessionId: SESSION,
      resourceId: RESOURCE,
      threadId: null,
      session: { modelId: '', state },
    }),
  )
  assert.equal(read.sessionId, SESSION)
  assert.equal(read.resourceId, RESOURCE)
  assert.equal(read.threadId, undefined)
  assert.equal(read.session?.modelId, undefined)
  assert.equal(read.session?.state?.get(), state.get())
})

test('fora de uma execução o controller é vazio, e a conversa da execução não existe', () => {
  assert.deepEqual(controllerIn(undefined), {})
  assert.deepEqual(controllerIn(contextOf('texto')), {})
  assert.equal(conversationRun(undefined), undefined)
})

test('a conversa da execução pede a sessão e o recurso juntos', () => {
  assert.equal(conversationRun(contextOf({ sessionId: SESSION })), undefined)
  assert.equal(conversationRun(contextOf({ resourceId: RESOURCE })), undefined)
  assert.deepEqual(conversationRun(contextOf({ sessionId: SESSION, resourceId: RESOURCE })), {
    sessionId: SESSION,
    resourceId: RESOURCE,
  })
})
