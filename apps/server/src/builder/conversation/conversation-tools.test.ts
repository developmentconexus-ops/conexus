import assert from 'node:assert/strict'
import { test } from 'node:test'
import { post } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, plantGemini, sent, started, streamOf } from './test-conversation.ts'
import { routedTo, served } from './test-research.ts'

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

test('um turno com `web_fetch` e `recall` nunca para à espera de aprovação: cada um roda e termina', async (t) => {
  const site = await served(t, (_path, response) => response.end('Cardápio da padaria'))
  routedTo(t, { 'padaria.example.test': site.port })
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    step += 1
    if (step > 1) return { kind: 'text', text: 'Li a página.' }
    return {
      kind: 'blocks',
      blocks: [
        { type: 'tool_use', name: 'web_fetch', input: { url: 'http://padaria.example.test/' } },
        { type: 'tool_use', name: 'recall', input: { mode: 'messages' } },
      ],
    }
  })
  /** Every run Mastra saves waiting, as an approval leaves it, from the moment its tables exist. */
  async function recordSuspensions() {
    await hub.test.mastraPool.query(`
      create table mastra.suspended_runs (run_id text);
      create function mastra.record_suspension() returns trigger language plpgsql as $$
      begin insert into mastra.suspended_runs values (new.run_id); return new; end $$;
      create trigger record_suspension after insert or update on mastra.mastra_workflow_snapshot
        for each row when (new.snapshot->>'status' = 'suspended')
        execute function mastra.record_suspension();
    `)
  }
  const { events } = await asked(t, {
    hub,
    person: ana,
    conversations,
    between: recordSuspensions,
  })
  const tools = events.flatMap((event) =>
    event.type === 'part' && event.part.type === 'tool'
      ? [[event.part.kind, event.part.state]]
      : [],
  )
  assert.deepEqual(tools, [
    ['read_page', 'running'],
    ['recall', 'running'],
    ['read_page', 'completed'],
    ['recall', 'completed'],
  ])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  const suspended = await hub.test.mastraPool.query('select run_id from mastra.suspended_runs')
  assert.deepEqual(suspended.rows, [], 'no run was saved waiting for an approval')
})
