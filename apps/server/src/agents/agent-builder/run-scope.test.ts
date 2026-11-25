import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sessionUrl } from '../../harness/routes/test-conversation.ts'
import { RUN_MARKS } from '../../harness/spec/public.ts'
import { plantMark } from '../../harness/spec/test-run.ts'
import { codeOf, plantCompany, post } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { otherProject } from '../saved-agent/test-agents.ts'
import { building } from './test-construtor.ts'

test('Projeto de outra empresa: a conversa do Construtor marcada com ele dá CONVERSATION_NOT_FOUND, sem chamada ao modelo', async (t) => {
  const asked: Sent[] = []
  const on = await building(t, [
    (call) => {
      asked.push(call)
      return [{ type: 'text', text: 'Pronto.' }]
    },
  ])
  const other = await plantCompany(on.hub.test, on.ana.id, 'Outra Empresa')
  const alien = await otherProject(on.hub, on.ana, `/api/companies/${other}`, [], 'Alheio')
  await plantMark(on.hub, String(on.url.split('/').at(-1)), {
    [RUN_MARKS.construtor.project]: alien.projectId,
  })
  const message = { message: 'Crie um agente de pedidos' }
  const sent = await post(on.hub, on.ana, `${sessionUrl(on.url)}/messages`, message)
  assert.deepEqual([sent.statusCode, codeOf(sent)], [404, 'CONVERSATION_NOT_FOUND'])
  assert.deepEqual(asked, [], 'the model is never called')
})
