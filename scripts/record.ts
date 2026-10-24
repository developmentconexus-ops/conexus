// Defect: every 14.2 screen passed on controller events and stored rows typed by hand in the shape
// the screen wanted, orders Mastra never produces (testing T24; method study, diff 6).
// `npm run record -- <scenario>` (cited, thinking or abort) runs the native flow once: Mastra's real
// AgentController, with the Builder's model and web tools, on Mastra's in-memory store, answering
// from the provider recording `apps/server/src/platform/recordings/anthropic-<scenario>.sse` through
// a fake `fetch`, as `scripts/record-provider.ts` made it. It saves every event the session emitted
// and every row Mastra stored, with the library, its version and the date in the first line, in
// apps/server/src/platform/recordings/mastra/<scenario>.jsonl. No service is called and no
// credential is read; every prompt is invented (security S40). `tool-error` is not a scenario: its
// recording holds one model call and the turn asks a second.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Agent } from '@mastra/core/agent'
import { AgentController } from '@mastra/core/agent-controller'
import { InMemoryStore } from '@mastra/core/storage'
import { webFetchTool, webSearchTool } from '@mastra/core/tools'
import { Memory } from '@mastra/memory'
import { z } from 'zod'
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
const Scenario = z.enum(['cited', 'thinking', 'abort'])

const Package = z.object({ version: z.string() })
function versionOf(name: string): string {
  const path = join(ROOT, 'node_modules', name, 'package.json')
  return Package.parse(JSON.parse(readFileSync(path, 'utf8'))).version
}

/** Answers the one model call from the provider recording; a second call is an error, not a guess. */
function replaying(name: string): () => void {
  const real = globalThis.fetch
  let calls = 0
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    if (!url.startsWith(MESSAGES_URL))
      throw new Error(`The recording reaches no other address: ${url}`)
    calls += 1
    if (calls > 1) throw new Error('A recording holds one model call; a second was asked.')
    return replayed(name, init?.signal)
  }
  return () => {
    globalThis.fetch = real
  }
}

async function record(scenario: z.infer<typeof Scenario>) {
  const source = `anthropic-${scenario}`
  const provider = Recording.parse(
    JSON.parse(readFileSync(join(RECORDINGS, `${source}.json`), 'utf8')),
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
    tools: { web_fetch: webFetchTool, web_search: webSearchTool },
    maxRetries: 0,
    memory,
  })
  const controller = new AgentController({
    id: 'builder',
    storage,
    memory,
    agent,
    modes: [{ id: 'conversa' }],
  })
  await controller.init()
  const session = await controller.createSession({ resourceId: OWNER, scope: scenario })
  const events: unknown[] = []
  let deltas = 0
  session.subscribe((event) => {
    events.push(event)
    if (event.type === 'message_update' && event.event.type === 'text-delta') deltas += 1
    if (scenario === 'abort' && deltas === ABORT_AFTER) session.abort()
  })
  const restore = replaying(source)
  try {
    await session.sendMessage({ content: PROMPTS[scenario] })
  } finally {
    restore()
  }
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
    source: `${source}.sse`,
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
