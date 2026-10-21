import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
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
  function searches(tools: readonly string[]) {
    return tools
      .filter((name) => !name.startsWith('mastra_workspace_') && !name.startsWith('skill'))
      .sort()
  }
  assert.deepEqual(
    anthropic.chats.filter(streamed).map((each) => searches(each.tools)),
    [['recall', 'web_fetch']],
  )
  assert.ok(gemini.length > 0, 'Gemini was called')
  for (const tools of gemini.filter((each) => each.length > 0)) {
    assert.deepEqual(searches(tools), ['recall', 'web_fetch'])
  }
  assert.deepEqual(
    anthropic.sent.filter(streamed).map((each) => searches(each.tools)),
    [['recall', 'web_fetch', 'web_search']],
  )
})

type Block = Extract<Reply, { kind: 'blocks' }>['blocks'][number]

const FETCH: Block = {
  type: 'tool_use',
  name: 'web_fetch',
  input: { url: 'http://padaria.example.test/' },
}
const RECALL: Block = { type: 'tool_use', name: 'recall', input: { mode: 'messages' } }

/** A turn calling `blocks` once, then answering; the runs Mastra saved waiting come back with it. */
async function calling(t: TestContext, blocks: Block[]) {
  const site = await served(t, (_path, response) => response.end('Cardápio da padaria'))
  routedTo(t, { 'padaria.example.test': site.port })
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    step += 1
    return step > 1 ? { kind: 'text', text: 'Li a página.' } : { kind: 'blocks', blocks }
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
  const { events } = await asked(t, { hub, person: ana, conversations, between: recordSuspensions })
  const tools = events.flatMap((event) =>
    event.type === 'part' && event.part.type === 'tool'
      ? [[event.part.kind, event.part.state]]
      : [],
  )
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  const suspended = await hub.test.mastraPool.query('select run_id from mastra.suspended_runs')
  return { tools, suspended: suspended.rows }
}

test('um turno com `web_fetch` nunca para à espera de aprovação: ele roda', async (t) => {
  const { tools, suspended } = await calling(t, [FETCH])
  assert.deepEqual(tools, [
    ['read_page', 'running'],
    ['read_page', 'completed'],
  ])
  assert.deepEqual(suspended, [], 'no run was saved waiting for an approval')
})

// `recall` is Memory's tool, which has no answer of its own: under `yolo` it runs at once, with no
// run saved waiting on the way.
test('um turno com `recall` termina sem parar à espera de aprovação', async (t) => {
  const { tools, suspended } = await calling(t, [RECALL])
  assert.deepEqual(tools, [
    ['recall', 'running'],
    ['recall', 'completed'],
  ])
  assert.deepEqual(suspended, [], 'no run was saved waiting for an approval')
})
