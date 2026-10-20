import assert from 'node:assert/strict'
import { test } from 'node:test'
import { webFetchTool } from '@mastra/core/tools'
import { post } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import {
  approvalsOf,
  BUILDER_FETCH,
  conversing,
  plantGemini,
  sent,
  started,
  streamOf,
} from './test-conversation.ts'

test('um modelo fora dos três fornecedores de busca, como o Google: só `web_fetch`; nos três, também `web_search`', async (t) => {
  const { hub, ana, companyId, conversations, anthropic } = await conversing(t, (asked) => ({
    kind: 'text',
    text: asked.stream ? 'Resposta' : 'Título',
  }))
  const gemini = plantGemini(t)
  const accounts = `/api/companies/${companyId}/model-accounts`
  const groq = { owner: 'company', provider: 'groq', label: 'Groq 1', key: 'gsk-test-key-0001' }
  const google = { owner: 'company', provider: 'google', label: 'Google 1', key: 'AIza-test-0001' }
  for (const account of [groq, google]) {
    assert.equal((await post(hub, ana, accounts, account)).statusCode, 201)
  }
  for (const model of ['groq/llama-3.3-70b-versatile', 'google/gemini-2.5-flash', undefined]) {
    const url = `${conversations}/${await started(hub, ana, conversations, { model })}`
    const stream = await streamOf(hub, ana, url)
    t.after(() => stream.close())
    assert.equal((await sent(hub, ana, url, 'Pesquise padarias')).statusCode, 202)
    assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  }
  function streamed(each: Sent) {
    return each.stream
  }
  assert.deepEqual(
    anthropic.chats.filter(streamed).map((each) => [...each.tools].sort()),
    [['recall', 'web_fetch']],
  )
  assert.ok(gemini.length > 0, 'Gemini was called')
  for (const tools of gemini.filter((each) => each.length > 0)) {
    assert.deepEqual(tools, ['recall', 'web_fetch'])
  }
  assert.deepEqual(
    anthropic.sent.filter(streamed).map((each) => [...each.tools].sort()),
    [['recall', 'web_fetch', 'web_search']],
  )
})

test('as ferramentas de leitura do Builder rodam sem pedir; qualquer outra é negada, nenhuma espera por aprovação', async (t) => {
  const { hub } = await conversing(t, () => ({ kind: 'text', text: 'Resposta' }))
  const names = ['web_fetch', 'web_search', 'recall', 'write_file', 'execute_command', 'mcp_tool']
  assert.deepEqual(await approvalsOf(t, hub, names), {
    web_fetch: 'allow',
    web_search: 'allow',
    recall: 'allow',
    write_file: 'deny',
    execute_command: 'deny',
    mcp_tool: 'deny',
  })
})

test('o `web_fetch` do Builder é o do Mastra inteiro; só a sua aprovação muda, e responde que não', () => {
  const { requireApproval, ...builder } = BUILDER_FETCH
  const { requireApproval: native, ...mastra } = webFetchTool
  assert.deepEqual(builder, mastra)
  assert.equal(Object.getPrototypeOf(BUILDER_FETCH), Object.getPrototypeOf(webFetchTool))
  assert.equal(native, false)
  assert.equal(typeof requireApproval, 'function')
  assert.equal(Reflect.apply(Object(requireApproval), undefined, []), false)
})
