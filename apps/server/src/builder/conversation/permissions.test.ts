import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, ModelAccountId, ModelId, PersonId } from '@conexus/hub-api'
import { Agent } from '@mastra/core/agent'
import { MessageList } from '@mastra/core/agent/message-list'
import { AgentController } from '@mastra/core/agent-controller'
import type { ProcessInputStepArgs } from '@mastra/core/processors'
import { InMemoryStore } from '@mastra/core/storage'
import { createTool } from '@mastra/core/tools'
import { MockLanguageModelV3 } from 'ai/test'
import { z } from 'zod'
import { call, post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { accountPick, callModel, Turn, turnContext } from '../model-accounts/public.ts'
import { TOOL_CLOSURE } from './public.ts'
import { asked, conversing, MODEL, title } from './test-conversation.ts'

const CONTROLLER_TOOLS = [
  'ask_user',
  'submit_plan',
  'task_write',
  'task_update',
  'task_complete',
  'task_check',
  'subagent',
]
const ALLOWED =
  /^(mastra_workspace_(read_file|list_files|grep|file_stat|write_file|edit_file|mkdir|delete|execute_command|get_process_output|kill_process)|web_search|web_fetch|recall|skill|skill_search|skill_read|conexus_check)$/

/** A model that calls `tools` in its first step and answers in the second. */
function calling(...tools: { name: string; input: object }[]) {
  let step = 0
  const seen: Sent[] = []
  function answer(call: Sent): Reply {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    seen.push(call)
    step += 1
    if (step > 1) return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: tools.map((tool) => ({ type: 'tool_use', ...tool })) }
  }
  return { answer, seen }
}

test('as ferramentas oferecidas são só ler, escrever e rodar: nenhuma das sete do controller, nenhuma fora das categorias liberadas', async (t) => {
  const model = calling({ name: 'mastra_workspace_list_files', input: { path: '.' } })
  const { hub, ana, conversations } = await conversing(t, model.answer)
  await asked(t, { hub, person: ana, conversations })
  const offered = model.seen[0]?.tools ?? []
  assert.ok(offered.includes('mastra_workspace_write_file'))
  assert.ok(offered.includes('mastra_workspace_execute_command'))
  assert.deepEqual(
    offered.filter((name) => CONTROLLER_TOOLS.includes(name)),
    [],
  )
  assert.deepEqual(
    offered.filter((name) => !ALLOWED.test(name)),
    [],
  )
  assert.equal(offered.includes('mastra_workspace_ast_edit'), false)
})

test('escrever e rodar um comando não param à espera de aprovação: nenhuma execução fica guardada como suspensa', async (t) => {
  const write = { name: 'mastra_workspace_write_file', input: { path: 'a.ts', content: 'x\n' } }
  const model = calling(write, {
    name: 'mastra_workspace_execute_command',
    input: { command: 'echo oi' },
  })
  const { hub, ana, conversations } = await conversing(t, model.answer)
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
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  const states = events.flatMap((event) =>
    event.type === 'part' && event.part.type === 'tool' ? [event.part.state] : [],
  )
  assert.deepEqual(states, ['running', 'running', 'completed', 'completed'])
  assert.deepEqual(
    (await hub.test.mastraPool.query('select run_id from mastra.suspended_runs')).rows,
    [],
  )
})

/** A model whose first step calls `tool` and whose next answers. */
function callingOnce(tool: string) {
  let step = 0
  return new MockLanguageModelV3({
    doStream: async () => {
      step += 1
      const parts =
        step === 1
          ? [{ type: 'tool-call' as const, toolCallId: 'c1', toolName: tool, input: '{}' }]
          : [
              { type: 'text-start' as const, id: 't' },
              { type: 'text-delta' as const, id: 't', delta: 'ok' },
              { type: 'text-end' as const, id: 't' },
            ]
      return {
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({ type: 'stream-start', warnings: [] })
            for (const part of parts) controller.enqueue(part)
            const usage = {
              inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
              outputTokens: { total: 1, text: 1, reasoning: 0 },
            }
            controller.enqueue({
              type: 'finish',
              finishReason: { unified: step === 1 ? 'tool-calls' : 'stop', raw: undefined },
              usage,
            })
            controller.close()
          },
        }),
      }
    },
  })
}

/** A controller closed as the Builder's is, with a tool the closure does not list. */
async function closedSession(ran: string[]) {
  const outside = createTool({
    id: 'github_create_issue',
    description: 'A tool outside the closed set.',
    inputSchema: z.object({}),
    execute: async () => {
      ran.push('github_create_issue')
      return 'created'
    },
  })
  const controller = new AgentController({
    id: 'closed',
    storage: new InMemoryStore(),
    agent: new Agent({
      id: 'closed',
      name: 'Closed',
      instructions: 'None.',
      model: callingOnce('github_create_issue'),
      tools: { github_create_issue: outside },
    }),
    modes: [{ id: 'conversa', availableTools: TOOL_CLOSURE.availableTools }],
    initialState: TOOL_CLOSURE.initialState,
  })
  await controller.init()
  return controller.createSession()
}

test('a sessão começa em yolo: nenhuma ferramenta da lista pede aprovação', async () => {
  const session = await closedSession([])
  for (const name of ['mastra_workspace_write_file', 'mastra_workspace_execute_command', 'recall'])
    assert.equal(session.resolveToolApproval(name), 'allow', name)
})

test('em yolo, uma ferramenta fora da lista do modo não é oferecida nem executada: chamada, é recusada', async () => {
  const ran: string[] = []
  const session = await closedSession(ran)
  const events: string[] = []
  session.subscribe((event) => {
    events.push(event.type)
  })
  await session.sendMessage({ content: 'Abra uma issue.' })
  assert.deepEqual(ran, [], 'the tool outside the set never ran')
  assert.equal(events.includes('tool_approval_required'), false)
  assert.ok(events.includes('tool_end'), events.join(' '))
})

function unused(): Promise<never> {
  return Promise.reject(new Error('the processor calls no model'))
}
function secondModel() {
  return callModel({
    specificationVersion: 'v2',
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    supportedUrls: {},
    doGenerate: unused,
    doStream: unused,
  })
}

/** The turn after the company's automatic switch: its account is given, so no database is asked. */
class SwitchedTurn extends Turn {
  override get switched() {
    return true
  }
  override modelId() {
    return ModelId.parse(MODEL)
  }
  override effort() {
    return 'off' as const
  }
  override async account() {
    return {
      ...{
        id: ModelAccountId.parse(crypto.randomUUID()),
        label: 'Time 1',
        kind: 'api_key' as const,
      },
      ...{ modelId: ModelId.parse(MODEL), model: await secondModel() },
    }
  }
}

test('a troca automática de modelo estreita o conjunto fechado e não o refaz: a ferramenta que não é da lista não volta', async () => {
  const closed = TOOL_CLOSURE.availableTools
  const tools = Object.fromEntries(
    [...closed, 'web_search', 'github_create_issue'].map((name) => [name, {}]),
  )
  const turn = new SwitchedTurn({
    companyId: CompanyId.parse('c'.repeat(32)),
    personId: PersonId.parse('person-switched'),
  })
  const processor = accountPick(Object.create(null))
  const result = await processor.processInputStep?.({
    ...{ stepNumber: 0, steps: [], systemMessages: [], state: {}, messages: [], retryCount: 0 },
    ...{
      model: await secondModel(),
      tools,
      activeTools: [...closed, 'web_search'],
      abort: () => assert.fail('the step is not aborted'),
    },
    messageList: new MessageList(),
    requestContext: turnContext(turn),
  })
  assert.ok(result !== undefined && !Array.isArray(result) && !(result instanceof MessageList))
  assert.deepEqual(
    result.activeTools,
    closed.filter((name) => name !== 'web_search'),
  )
})
