// Defect: every 14.2 screen passed on controller events and stored rows typed by hand in the shape
// the screen wanted, orders Mastra never produces (testing T24; method study, diff 6).
// `npm run record -- <scenario>` (cited, thinking, abort, plan, files, tasks or reads) runs the native flow once: Mastra's
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
// then an answer with its numbers, for the numbers' check (step 24.1, criterion 11a). `tool-error` is not a scenario: its
// recording holds one model call and the turn asks a second.
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
import type { Block } from '../apps/server/src/platform/test-anthropic-stream.ts'
import { events as streamed } from '../apps/server/src/platform/test-anthropic-stream.ts'
import type { NativeHeader } from '../apps/server/src/platform/test-recordings.ts'
import {
  LEAK,
  NATIVE_RECORDINGS,
  RECORDINGS,
  Recording,
  replayed,
} from '../apps/server/src/platform/test-recordings.ts'

const ROOT = join(import.meta.dirname, '..')
const CLAUDE = 'claude-sonnet-4-6'
const MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const OWNER = 'recording'
/** The deltas an `abort` scenario lets through before the session stops, as a person's stop would. */
const ABORT_AFTER = 4

const PROMPTS = {
  cited:
    'Pesquise na web duas receitas de pão de queijo e diga, em duas frases, o que cada uma usa, citando as fontes.',
  thinking:
    'Uma padaria inventada vende 120 pães por dia a R$ 0,80 cada. Quanto ela fatura em 30 dias? Pense antes de responder.',
  abort: 'Escreva uma lista de 60 nomes inventados de padarias, um por linha, sem comentários.',
}
const Scenario = z.enum(['cited', 'thinking', 'abort', 'plan', 'files', 'tasks', 'reads'])

const PLAN_FILE = '.conexus/plans/encomendas.md'
const PLAN_PROMPT = 'Planeje um app de encomendas para uma padaria inventada.'
const STEER = 'Só eu cadastro.'
/** What the model does in the `plan` scenario: submit the plan, use a tool, and answer once the person's steer is in. */
const PLAN_CALLS: Block[][] = [
  [{ type: 'tool_use', name: 'submit_plan', input: { path: PLAN_FILE } }],
  [{ type: 'tool_use', name: 'anotar', input: { nota: 'Plano aprovado, começando.' } }],
  [{ type: 'text', text: 'Pronto, o cadastro será só seu.' }],
]

const FILES_PROMPT = 'Leia os arquivos e diga, em uma frase, o que a padaria inventada precisa.'
const MORE_FILES_PROMPT = 'Este PDF também vale.'
/** Invented and tiny (security S40): a markdown note, a PDF and a 1×1 PNG, as the browser reads them. */
const MARKDOWN = '# Observações\n\nSem glúten.\n'
const PDF = '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
function dataUrl(mediaType: string, base64: string): string {
  return `data:${mediaType};base64,${base64}`
}
function text64(text: string): string {
  return Buffer.from(text).toString('base64')
}
const FILES = [
  {
    filename: 'observacoes.md',
    mediaType: 'text/markdown',
    data: dataUrl('text/markdown', text64(MARKDOWN)),
  },
  {
    filename: 'precos.pdf',
    mediaType: 'application/pdf',
    data: dataUrl('application/pdf', text64(PDF)),
  },
  { filename: 'logo.png', mediaType: 'image/png', data: dataUrl('image/png', PNG) },
]
const MORE_FILE = {
  filename: 'cardapio.pdf',
  mediaType: 'application/pdf',
  data: dataUrl('application/pdf', text64(PDF)),
}
/** What the model does in the `files` scenario: use its tool, and answer once the second message is in. */
const FILES_CALLS: Block[][] = [
  [{ type: 'tool_use', name: 'anotar', input: { nota: 'Arquivos lidos.' } }],
  [{ type: 'text', text: 'Ela precisa de pães sem glúten.' }],
]

const TASKS_PROMPT = 'Monte um app de encomendas para uma padaria inventada, por tarefas.'
const PLANNED = [
  { id: '1', content: 'Montar a tabela', activeForm: 'Montando a tabela', status: 'in_progress' },
  { id: '2', content: 'Fazer a tela', activeForm: 'Fazendo a tela', status: 'pending' },
  { id: '3', content: 'Conferir o app', activeForm: 'Conferindo o app', status: 'pending' },
]
/** What the model does in the `tasks` scenario: plan three tasks, complete two, one call each, and answer. */
const TASKS_CALLS: Block[][] = [
  [{ type: 'tool_use', name: 'task_write', input: { tasks: PLANNED } }],
  [{ type: 'tool_use', name: 'task_complete', input: { id: '1' } }],
  [{ type: 'tool_use', name: 'task_complete', input: { id: '2' } }],
  [{ type: 'text', text: 'Falta conferir o app.' }],
]

const READS_PROMPT = 'Quanto a Padaria Sol vendeu em setembro de 2026 por vendedor?'
const SOLD_BY_SELLER =
  "SELECT V.APELIDO, ROUND(SUM(I.VLRTOT), 2) AS TOTAL FROM TGFCAB C JOIN TGFITE I ON I.NUNOTA = C.NUNOTA JOIN TGFVEN V ON V.CODVEND = C.CODVEND WHERE C.DTNEG BETWEEN '2026-09-01' AND '2026-09-30' GROUP BY V.APELIDO ORDER BY TOTAL DESC"
/** What the model does in the `reads` scenario: read the Matriz by seller, then answer with what it read. */
const READS_CALLS: Block[][] = [
  [
    {
      type: 'tool_use',
      name: 'connector_read',
      input: {
        connection: 'Matriz',
        operation: 'sankhya.consultar',
        input: { sql: SOLD_BY_SELLER },
      },
    },
  ],
  [
    {
      type: 'text',
      text: 'Em setembro de 2026, na Matriz: JOAO vendeu R$ 8.072,70, RITA R$ 7.951,50 e MARCIA R$ 7.726,50.',
    },
  ],
]
const matriz = salesDatabase(PADARIA_SOL_MATRIZ)

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
const CALLS = { plan: PLAN_CALLS, files: FILES_CALLS, tasks: TASKS_CALLS, reads: READS_CALLS }

/** Plays the scenario on the session, with the model calls answered from the recording; the events it emitted. */
async function run(session: Session, scenario: z.infer<typeof Scenario>): Promise<unknown[]> {
  const events: unknown[] = []
  let deltas = 0
  let suspended: string | undefined
  const ended = Promise.withResolvers<void>()
  let ends = 0
  session.subscribe((event) => {
    events.push(event)
    if (event.type === 'message_update' && event.event.type === 'text-delta') deltas += 1
    if (scenario === 'abort' && deltas === ABORT_AFTER) session.abort()
    if (event.type === 'tool_suspended') suspended = event.toolCallId
    // The person's steer goes in while the run uses its tool, as in a build.
    if (scenario === 'plan' && event.type === 'tool_start' && event.toolName === 'anotar')
      void session.sendMessage({ content: STEER })
    if (scenario === 'files' && event.type === 'tool_start' && event.toolName === 'anotar')
      void session.sendMessage({ content: MORE_FILES_PROMPT, files: [MORE_FILE] })
    if (
      (scenario === 'files' || scenario === 'tasks' || scenario === 'reads') &&
      event.type === 'agent_end'
    )
      ended.resolve()
    if (scenario === 'plan' && event.type === 'agent_end') {
      ends += 1
      if (ends === 2) ended.resolve()
    }
  })
  const answers: Answer[] =
    scenario === 'plan' || scenario === 'files' || scenario === 'tasks' || scenario === 'reads'
      ? CALLS[scenario].map(
          (blocks, at, calls) => () =>
            new Response(
              streamed(CLAUDE, blocks, at === calls.length - 1 ? 'end_turn' : 'tool_use'),
              { headers: { 'content-type': 'text/event-stream' } },
            ),
        )
      : [(signal) => replayed(`anthropic-${scenario}`, signal)]
  const restore = replaying(answers)
  try {
    if (scenario === 'files') {
      await session.sendMessage({ content: FILES_PROMPT, files: FILES })
      await ended.promise
    } else if (scenario === 'tasks' || scenario === 'reads') {
      await session.sendMessage({ content: scenario === 'tasks' ? TASKS_PROMPT : READS_PROMPT })
      await ended.promise
    } else {
      await session.sendMessage({ content: scenario === 'plan' ? PLAN_PROMPT : PROMPTS[scenario] })
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
  anotar: createTool({
    id: 'anotar',
    description: 'Anota uma nota.',
    inputSchema: z.object({ nota: z.string() }),
    execute: async () => 'Anotado.',
  }),
}

async function record(scenario: z.infer<typeof Scenario>) {
  const planned = scenario in CALLS
  const source = planned ? 'test-anthropic-stream.ts' : `anthropic-${scenario}.sse`
  // The plan's calls are not a provider's recording; the SDK that reads them is the one of any other.
  const provider = Recording.parse(
    JSON.parse(
      readFileSync(join(RECORDINGS, `anthropic-${planned ? 'abort' : scenario}.json`), 'utf8'),
    ),
  )
  // Mastra's router reads the key of the provider from the environment; this one is invented.
  process.env.ANTHROPIC_API_KEY = 'invented-key'
  const storage = new InMemoryStore()
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
    // As the Builder runs its tools (decision 0053): without asking.
    initialState: { yolo: true },
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
