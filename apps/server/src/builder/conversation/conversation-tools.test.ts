import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { ConversationEvent, MastraPart } from '@conexus/hub-api'
import { post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import {
  answeredOf,
  asked,
  conversing,
  plantGemini,
  sent,
  started,
  streamOf,
} from './test-conversation.ts'
import { partsOf } from './test-parts.ts'
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
      .filter(
        (name) =>
          !name.startsWith('mastra_workspace_') &&
          !name.startsWith('skill') &&
          !name.startsWith('task_') &&
          name !== 'ask_user' &&
          name !== 'submit_plan',
      )
      .sort()
  }
  assert.deepEqual(
    anthropic.chats.filter(streamed).map((each) => searches(each.tools)),
    [['conexus_check', 'recall', 'web_fetch']],
  )
  assert.ok(gemini.length > 0, 'Gemini was called')
  for (const tools of gemini.filter((each) => each.length > 0)) {
    assert.deepEqual(searches(tools), ['conexus_check', 'recall', 'web_fetch'])
  }
  assert.deepEqual(
    anthropic.sent.filter(streamed).map((each) => searches(each.tools)),
    [['conexus_check', 'recall', 'web_fetch', 'web_search']],
  )
})

type Block = Extract<Reply, { kind: 'blocks' }>['blocks'][number]

const FETCH: Block = {
  type: 'tool_use',
  name: 'web_fetch',
  input: { url: 'http://padaria.example.test/' },
}
const RECALL: Block = { type: 'tool_use', name: 'recall', input: { mode: 'messages' } }

/** The tool name and state of each tool part the events said, in order. */
function toolStates(events: ConversationEvent[]) {
  return partsOf(events).flatMap((part) =>
    part.type === 'tool-invocation'
      ? [[part.toolInvocation.toolName, part.toolInvocation.state]]
      : [],
  )
}

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
  const tools = toolStates(events)
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  const suspended = await hub.test.mastraPool.query('select run_id from mastra.suspended_runs')
  return { tools, suspended: suspended.rows }
}

test('um turno com `web_fetch` nunca para à espera de aprovação: ele roda', async (t) => {
  const { tools, suspended } = await calling(t, [FETCH])
  assert.deepEqual(tools, [
    ['web_fetch', 'call'],
    ['web_fetch', 'result'],
  ])
  assert.deepEqual(suspended, [], 'no run was saved waiting for an approval')
})

// `recall` is Memory's tool, which has no answer of its own: under `yolo` it runs at once, with no
// run saved waiting on the way.
test('um turno com `recall` termina sem parar à espera de aprovação', async (t) => {
  const { tools, suspended } = await calling(t, [RECALL])
  assert.deepEqual(tools, [
    ['recall', 'call'],
    ['recall', 'result'],
  ])
  assert.deepEqual(suspended, [], 'no run was saved waiting for an approval')
})

// The memory's `recall` reads the conversation in progress only: another conversation of the same
// person, even in the same Projeto, is not its to list (founder: "Scope correto", thread).
test('`recall` lista só a conversa em curso, não as outras da mesma pessoa', async (t) => {
  let step = 0
  const results: string[][] = []
  const recall: Block = { type: 'tool_use', name: 'recall', input: { mode: 'threads' } }
  const { hub, ana, conversations } = await conversing(t, (call) => {
    if (!call.stream) return { kind: 'text', text: 'Título' }
    step += 1
    results.push(call.texts)
    if (step === 2) return { kind: 'blocks', blocks: [recall] }
    return { kind: 'text', text: 'Pronto.' }
  })
  await asked(t, { hub, person: ana, conversations }, 'Primeira conversa')
  await asked(t, { hub, person: ana, conversations }, 'Segunda conversa')
  const listed = results.at(2)?.find((text) => text.includes('"threads"'))
  assert.ok(listed !== undefined, 'the second conversation read the listing')
  assert.equal(Object(JSON.parse(listed)).count, 1)
})

// A tool outside the closed set is refused by the controller, not run: the person reads "Não pôde
// usar uma ferramenta", live and read back, never an error of the Builder's.
test('um turno que pede uma ferramenta fora das liberadas a vê recusada (erro), ao vivo e relida', async (t) => {
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (call) => {
    if (!call.stream) return { kind: 'text', text: 'Título' }
    step += 1
    if (step > 1) return { kind: 'text', text: 'Não deu.' }
    return {
      kind: 'blocks',
      blocks: [{ type: 'tool_use', name: 'github_create_issue', input: {} }],
    }
  })
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  function ended(parts: MastraPart[]) {
    return parts.flatMap((part) =>
      part.type === 'tool-invocation' && part.toolInvocation.state !== 'call'
        ? [[part.toolInvocation.toolName, part.toolInvocation.state, part.toolInvocation.isError]]
        : [],
    )
  }
  // Live, Mastra says the refusal as a result that is an error; stored, as an `output-error`.
  assert.deepEqual(ended(partsOf(events)), [['github_create_issue', 'result', true]])
  const all = await answeredOf(hub, ana, url)
  assert.deepEqual(
    all.flatMap((message) => ended(message.parts)),
    [['github_create_issue', 'output-error', undefined]],
  )
})
