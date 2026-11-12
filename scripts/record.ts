// Defect: every 14.2 screen passed on controller events and stored rows typed by hand, orders Mastra never produces (testing T24; method study, diff 6).
// `npm run record -- <scenario>` (cited, thinking, abort, plan, files, tasks, reads, research, research-failed, handoff, approval, approval-declined, approval-interrupted, approval-stopped or approval-refused) runs the native flow once: Mastra's
// real AgentController, with the Builder's model and web tools, on Mastra's in-memory store, answering
// from the provider recording `apps/server/src/platform/recordings/anthropic-<scenario>.sse` through
// a fake `fetch`, as `scripts/record-provider.ts` made it. `plan` has no provider recording: it needs
// three model calls (a plan, a tool, an answer), so its calls are streamed by the Messages API stream
// the server tests' double uses (`test-anthropic-stream.ts`), and the run is approved and steered the
// way a person does. `files` is scripted the same way (a tool call, then an answer): a message with
// a markdown file, a PDF and a PNG, and a second one with a PDF while the run works. It saves
// every event the session emitted and every row Mastra stored, with the library, its version and the
// date in the first line, in apps/server/src/platform/recordings/mastra/<scenario>.jsonl. No service
// is called and no credential is read; every prompt is invented (security S40). `reads` is the
// Assistant's turn: a `connector_read` that runs its SQL on the Sankhya double's Padaria Sol (Matriz),
// then an answer with its numbers (step 24.1, criterion 11a). `research` and `research-failed` are the
// Assistant's helper (U12): Mastra's `subagent` tool of type `pesquisar` runs its own model call, which
// answers in `research` and is refused by the provider in `research-failed`. `tool-error` is no scenario: its recording holds one model call and the turn asks a second.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Agent } from '@mastra/core/agent'
import { AgentController } from '@mastra/core/agent-controller'
import { InMemoryStore } from '@mastra/core/storage'
import {
  createTool,
  taskCompleteTool,
  taskWriteTool,
  webFetchTool,
  webSearchTool,
} from '@mastra/core/tools'
import { Memory } from '@mastra/memory'
import { z } from 'zod'
import { PADARIA_SOL_MATRIZ, salesDatabase } from '../apps/server/src/hub/connectors/test-sales.ts'
import { events as streamed } from '../apps/server/src/platform/test-anthropic-stream.ts'
import type { NativeHeader } from '../apps/server/src/platform/test-recordings.ts'
import {
  LEAK,
  NATIVE_RECORDINGS,
  RECORDINGS,
  Recording,
  replayed,
} from '../apps/server/src/platform/test-recordings.ts'
import { orderBook } from '../packages/connectors/src/sankhya/fake-orders.ts'
import * as approval from './record-approval.ts'
import {
  APPROVAL_CALLS,
  APPROVAL_PROMPT,
  APPROVAL_TOOL,
  FILES,
  FILES_CALLS,
  FILES_PROMPT,
  HANDOFF_CALLS,
  HANDOFF_SIGNAL,
  MORE_FILE,
  MORE_FILES_PROMPT,
  PLAN_CALLS,
  PLAN_PROMPT,
  READS_CALLS,
  READS_PROMPT,
  RESEARCH_CALLS,
  RESEARCH_FAILED_CALLS,
  RESEARCH_PROMPT,
  RESEARCH_TYPE,
  STEER,
  TASKS_CALLS,
  TASKS_PROMPT,
} from './record-calls.ts'

const ROOT = join(import.meta.dirname, '..')
const CLAUDE = 'claude-sonnet-4-6'
const MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const OWNER = 'recording'
/** The deltas an `abort` scenario lets through before the session stops, as a person's stop would. */
const ABORT_AFTER = 4

const PROMPTS: Record<string, string> = {
  cited:
    'Pesquise na web duas receitas de pão de queijo e diga, em duas frases, o que cada uma usa, citando as fontes.',
  thinking:
    'Uma padaria inventada vende 120 pães por dia a R$ 0,80 cada. Quanto ela fatura em 30 dias? Pense antes de responder.',
  abort: 'Escreva uma lista de 60 nomes inventados de padarias, um por linha, sem comentários.',
}
const Scenario = z.enum([
  'cited',
  'thinking',
  'abort',
  'plan',
  'files',
  'tasks',
  'reads',
  'handoff',
  'research',
  'research-failed',
  ...approval.APPROVALS,
])

const matriz = salesDatabase(PADARIA_SOL_MATRIZ)
const orders = orderBook()

const Package = z.object({ version: z.string() })
function versionOf(name: string): string {
  const path = join(ROOT, 'node_modules', name, 'package.json')
  return Package.parse(JSON.parse(readFileSync(path, 'utf8'))).version
}

type Answer = (signal: AbortSignal | null | undefined) => Response

/** Answers the model calls in order; one more than the recording holds is an error, not a guess. */
function replaying(answers: Answer[]): () => void {
  const real = globalThis.fetch
  let calls = 0
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    // Mastra downloads a file's data URL through `fetch` before each call; it reaches no address.
    if (url.startsWith('data:')) return real(input, init)
    if (!url.startsWith(MESSAGES_URL))
      throw new Error(`The recording reaches no other address: ${url}`)
    calls += 1
    const answer = answers[calls - 1]
    if (answer === undefined)
      throw new Error(`A recording holds ${answers.length} model call(s); another was asked.`)
    return answer(init?.signal)
  }
  return () => {
    globalThis.fetch = real
  }
}

type Session = Awaited<ReturnType<AgentController['createSession']>>

const TASK_TOOLS = { task_write: taskWriteTool, task_complete: taskCompleteTool }
const Scripted = Scenario.exclude(['cited', 'thinking', 'abort'])
const CALLS = {
  plan: PLAN_CALLS,
  files: FILES_CALLS,
  tasks: TASKS_CALLS,
  reads: READS_CALLS,
  handoff: HANDOFF_CALLS,
  research: RESEARCH_CALLS,
  'research-failed': RESEARCH_FAILED_CALLS,
  ...APPROVAL_CALLS,
}

/** The prompt of each scenario that sends one message and waits for the run to end. */
const asked = new Map<string, string>([
  ['tasks', TASKS_PROMPT],
  ['reads', READS_PROMPT],
  ['research', RESEARCH_PROMPT],
  ['research-failed', RESEARCH_PROMPT],
])

/** The helper's own model call in `research-failed`: the provider refuses it, as an account that does not answer. */
const REFUSED: Answer = () =>
  new Response(
    JSON.stringify({
      type: 'error',
      error: { type: 'invalid_request_error', message: 'a conta da conversa não respondeu' },
    }),
    { status: 400, headers: { 'content-type': 'application/json' } },
  )

/** Plays the scenario on the session, with the model calls answered from the recording; the events it emitted. */
async function run(session: Session, scenario: z.infer<typeof Scenario>): Promise<unknown[]> {
  const events: unknown[] = []
  let deltas = 0
  let suspended: string | undefined
  const ended = Promise.withResolvers<void>()
  let ends = 0
  session.subscribe((event) => {
    events.push(approval.wired(event))
    if (event.type === 'message_update' && event.event.type === 'text-delta') deltas += 1
    if (scenario === 'abort' && deltas === ABORT_AFTER) session.abort()
    if (event.type === 'tool_suspended') suspended = event.toolCallId
    // The person's steer goes in while the run uses its tool, as in a build.
    if (scenario === 'plan' && event.type === 'tool_start' && event.toolName === 'anotar')
      void session.sendMessage({ content: STEER })
    if (scenario === 'files' && event.type === 'tool_start' && event.toolName === 'anotar')
      void session.sendMessage({ content: MORE_FILES_PROMPT, files: [MORE_FILE] })
    if (
      (scenario === 'files' || asked.has(scenario) || scenario === 'handoff') &&
      event.type === 'agent_end'
    )
      ended.resolve()
    approval.approvalReaction(session, scenario, event, ended)
    if (scenario === 'plan' && event.type === 'agent_end') {
      ends += 1
      if (ends === 2) ended.resolve()
    }
  })
  const scripted = Scripted.safeParse(scenario)
  const answers: Answer[] = scripted.success
    ? CALLS[scripted.data].map(
        (blocks, at, calls) => () =>
          new Response(
            streamed(CLAUDE, blocks, at === calls.length - 1 ? 'end_turn' : 'tool_use'),
            { headers: { 'content-type': 'text/event-stream' } },
          ),
      )
    : [(signal) => replayed(`anthropic-${scenario}`, signal)]
  if (scenario === 'research-failed') answers[1] = REFUSED
  const restore = replaying(answers)
  try {
    if (scenario === 'files') {
      await session.sendMessage({ content: FILES_PROMPT, files: FILES })
      await ended.promise
    } else if (scenario === 'handoff') {
      await session.sendSignal(HANDOFF_SIGNAL, { requireDelivery: true }).accepted
      await ended.promise
    } else if (approval.isApproval(scenario)) {
      await session.sendMessage({ content: APPROVAL_PROMPT })
      await ended.promise
    } else if (asked.has(scenario)) {
      await session.sendMessage({ content: asked.get(scenario) ?? '' })
      await ended.promise
    } else {
      await session.sendMessage({
        content: scenario === 'plan' ? PLAN_PROMPT : (PROMPTS[scenario] ?? ''),
      })
    }
    if (scenario === 'plan') {
      if (suspended === undefined) throw new Error('The plan was not parked on the person.')
      await session.respondToToolSuspension({
        toolCallId: suspended,
        resumeData: { action: 'approved' },
      })
      await ended.promise
    }
  } finally {
    restore()
  }
  return events
}

/** The tools the recorded agent has: the Builder's task and web tools, and two invented ones. */
const RECORDED_TOOLS = {
  ...TASK_TOOLS,
  web_fetch: webFetchTool,
  web_search: webSearchTool,
  connector_read: createTool({
    id: 'connector_read',
    description: 'Reads a connection the conversation chose.',
    inputSchema: z.object({
      connection: z.string(),
      operation: z.string(),
      input: z.object({ sql: z.string() }),
    }),
    execute: async ({ input }) => {
      const answered = matriz(input.sql)
      if (answered === undefined) return { kind: 'REFUSED' }
      const linhas = answered.rows.map((row) =>
        Object.fromEntries(answered.fields.map((name, at) => [name, row[at] ?? null])),
      )
      return { kind: 'OK', value: { linhas, completo: true }, complete: true }
    },
  }),
  [APPROVAL_TOOL]: approval.approvalTool(orders, process.argv.includes('approval-refused')),
  anotar: createTool({
    id: 'anotar',
    description: 'Anota uma nota.',
    inputSchema: z.object({ nota: z.string() }),
    execute: async () => 'Anotado.',
  }),
}

/** The Assistant's helper type (`builder/assistant/research.ts`), with no tools of its own here. */
const RESEARCH_HELPER = {
  id: RESEARCH_TYPE,
  name: 'Pesquisa',
  description: 'Reads one focused question and returns the findings.',
  instructions: 'Answer the task in Brazilian Portuguese.',
  defaultModelId: `anthropic/${CLAUDE}`,
}

async function record(scenario: z.infer<typeof Scenario>) {
  const planned = Scripted.safeParse(scenario).success
  const source = planned ? 'test-anthropic-stream.ts' : `anthropic-${scenario}.sse`
  // The plan's calls are not a provider's recording; the SDK that reads them is the one of any other.
  const provider = Recording.parse(
    JSON.parse(
      readFileSync(join(RECORDINGS, `anthropic-${planned ? 'abort' : scenario}.json`), 'utf8'),
    ),
  )
  // Mastra's router reads the key of the provider from the environment; this one is invented.
  process.env.ANTHROPIC_API_KEY = 'invented-key'
  const storage = approval.isApproval(scenario)
    ? approval.approvalStore(scenario)
    : new InMemoryStore()
  const memory = new Memory({ storage })
  const agent = new Agent({
    id: 'builder',
    name: 'Builder',
    instructions: 'Answer in Brazilian Portuguese.',
    model: `anthropic/${CLAUDE}`,
    tools: RECORDED_TOOLS,
    maxRetries: 0,
    memory,
  })
  const controller = new AgentController({
    id: 'builder',
    storage,
    memory,
    agent,
    modes: [{ id: 'conversa' }],
    subagents: [RESEARCH_HELPER],
    // As the Builder runs its tools (decision 0053): without asking; the agents' controller asks about a write.
    initialState: { yolo: !approval.isApproval(scenario) },
  })
  await controller.init()
  const session = await controller.createSession({ resourceId: OWNER, id: scenario })
  const events = await run(session, scenario)
  const threadId = session.thread.getId()
  const memoryStore = await storage.getStore('memory')
  if (memoryStore === undefined || threadId === null) throw new Error('Mastra kept no thread.')
  const { messages } = await memoryStore.listMessages({ threadId, perPage: false })
  const thread = await memoryStore.getThreadById({ threadId })
  const header: NativeHeader = {
    kind: 'header',
    scenario,
    library: '@mastra/core',
    version: versionOf('@mastra/core'),
    sdk: provider.sdk,
    source,
    recordedAt: new Date().toISOString().slice(0, 10),
  }
  const lines = [
    header,
    ...events.map((event) => ({ kind: 'event', event })),
    ...messages.map((row) => ({ kind: 'row', table: 'message', row })),
    { kind: 'row', table: 'thread', row: thread },
  ]
  const text = `${lines.map((line) => JSON.stringify(line)).join('\n')}\n`
  if (LEAK.test(text))
    throw new Error('The recording carries an address or a credential; nothing is saved.')
  mkdirSync(NATIVE_RECORDINGS, { recursive: true })
  writeFileSync(join(NATIVE_RECORDINGS, `${scenario}.jsonl`), text)
  console.log(`Saved ${scenario}.jsonl: ${events.length} events, ${messages.length} rows.`)
}

await record(Scenario.parse(process.argv[2]))
