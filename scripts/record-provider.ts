// Defect: a provider double answers in a shape the real provider never sends, so a test passes on
// a part the screen wants and the real stream breaks it (testing T24, PR 191).
// `npm run record-provider -- --provider anthropic|google --case cited|thinking|tool-error|abort`
// runs one model call through the same model the Hub builds for the account kind, Claude's
// subscription (`subscriptionModel`) or Gemini through CLIProxy (`callModel` with its URL), and
// saves the body the installed SDK received in apps/server/src/platform/recordings/, with the
// provider, API, SDK version and date beside it. The credential comes from the environment only
// and never reaches a file or the output (security S40): CONEXUS_RECORD_CLAUDE_TOKEN for Claude,
// CONEXUS_RECORD_CLIPROXY_URL and CONEXUS_RECORD_CLIPROXY_KEY for Gemini. Every prompt is invented.
// `--provider anthropic|openai|google --case models` saves the first page of the model list the
// provider gives the credential (CONEXUS_RECORD_CLAUDE_TOKEN, CONEXUS_RECORD_OPENAI_KEY or
// CONEXUS_RECORD_GOOGLE_KEY); with `--via cliproxy` (google only) the list of the local CLIProxy
// (CONEXUS_RECORD_CLIPROXY_URL, CONEXUS_RECORD_CLIPROXY_KEY): one GET, authorized by the founder's "A" of 2026-10-21 (step 12.3).
// Gemini records `abort` and `thinking`: its search waits for #150. Authorized once, by the founder's
// "2A" of 2026-10-20. Gemini's `thinking` is the 14.2 proof of criterion 20: `--model` names what
// CLIProxy is asked for (`gemini-3.8-flash-high` carries the level in the name, `gemini-3.8-flash`
// takes it as `reasoning_effort`) and `--effort low|medium|high` sends that field; the run prints
// the model and `reasoning_effort` the request carried and whether `reasoning_content` came back.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { ModelId, ProviderId } from '@conexus/hub-api'
import { z } from 'zod'
import {
  AnthropicPage,
  callModel,
  GooglePage,
  listRequest,
  OpenAiList,
  providerOptionsOf,
  subscriptionModel,
} from '../apps/server/src/builder/model-accounts/public.ts'
import type { Recording } from '../apps/server/src/platform/test-recordings.ts'
import { LEAK, RECORDINGS } from '../apps/server/src/platform/test-recordings.ts'

const ROOT = join(import.meta.dirname, '..')
// The subscription no longer serves Claude Sonnet 4.5; 4.6 is the nearest it
// serves, and it still answers with thinking off, as the Hub's `off` asks.
const CLAUDE = 'claude-sonnet-4-6'
// The local CLIProxy's Gemini model that the router's registry also knows.
const GEMINI = 'gemini-3.5-flash-lite'
/**
 * The deltas an `abort` case lets through before it stops the call, as a person's stop would; the
 * body keeps every byte that had arrived by then, which can hold a few deltas more.
 */
const ABORT_AFTER = 4
/** The whole call's budget (code C57). */
const CALL_MS = 120_000

const Args = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('anthropic'),
    case: z.enum(['cited', 'thinking', 'tool-error', 'abort']),
  }),
  z.object({
    provider: z.literal('google'),
    case: z.enum(['abort', 'thinking']),
    model: z.string().min(1).default(GEMINI),
    effort: z.enum(['low', 'medium', 'high']).optional(),
  }),
])
type Args = z.infer<typeof Args>
type ModelsArgs = z.infer<typeof ModelsArgs>

// The model lists (card 12.3, review 1b): `--case models` saves the first page of what the provider
// lists for the credential, to check the schemas the Hub reads it with against the real answer.
const ModelsArgs = z.object({
  provider: z.enum(['anthropic', 'openai', 'google']),
  case: z.literal('models'),
  via: z.literal('cliproxy').optional(),
})
// The Hub's own schemas, loose: the body is checked as the Hub reads it and kept whole, indented as
// the other recordings are.
const LIST_SCHEMAS = {
  anthropic: AnthropicPage.loose(),
  openai: OpenAiList.loose(),
  google: GooglePage.loose(),
}
const ListKeys = z.object({
  anthropic: z.object({ CONEXUS_RECORD_CLAUDE_TOKEN: z.string().min(1) }),
  openai: z.object({ CONEXUS_RECORD_OPENAI_KEY: z.string().min(1) }),
  google: z.object({ CONEXUS_RECORD_GOOGLE_KEY: z.string().min(1) }),
})

const Claude = z.object({ CONEXUS_RECORD_CLAUDE_TOKEN: z.string().min(1) })
const Gemini = z.object({
  CONEXUS_RECORD_CLIPROXY_URL: z.url(),
  CONEXUS_RECORD_CLIPROXY_KEY: z.string().min(1),
})

/** The invented question each case asks, in Portuguese as a person of the company would. */
const PROMPTS: Record<Args['case'], string> = {
  cited:
    'Pesquise na web duas receitas de pão de queijo e diga, em duas frases, o que cada uma usa, citando as fontes.',
  thinking:
    'Uma padaria inventada vende 120 pães por dia a R$ 0,80 cada. Quanto ela fatura em 30 dias? Pense antes de responder.',
  'tool-error':
    'Leia a página http://padaria-inventada.example.test/cardapio e diga o que ela vende.',
  abort: 'Escreva uma lista de 60 nomes inventados de padarias, um por linha, sem comentários.',
}

/** The Hub's two web tools as the Messages API receives them from Mastra's `webFetchTool` and `webSearchTool`. */
const WEB_TOOLS = [
  {
    type: 'function' as const,
    name: 'web_fetch',
    description: 'Fetch a web page by URL and return text content with basic response metadata.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string' as const,
          minLength: 1,
          description: 'The fully qualified HTTP or HTTPS URL to fetch.',
        },
      },
      required: ['url'],
      additionalProperties: false,
    },
  },
  {
    type: 'provider' as const,
    id: 'anthropic.web_search_20250305' as const,
    name: 'web_search',
    args: {},
  },
]

const Package = z.object({ version: z.string() })

function versionOf(name: string): string {
  const path = join(ROOT, 'node_modules', name, 'package.json')
  return `${name} ${Package.parse(JSON.parse(readFileSync(path, 'utf8'))).version}`
}

// Mastra's provider options are JSON under its own copy of the provider types; parsed as JSON, they
// fit the call of either SDK.
// biome-ignore lint/plugin: `z.json()` builds the JSON schema; it parses no reply, which C27 is about
const Options = z.record(z.string(), z.record(z.string(), z.json()))

/** The call's question, its reasoning as the Hub would ask it, and its stop. */
type Asked = {
  prompt: [
    { role: 'system'; content: string },
    { role: 'user'; content: [{ type: 'text'; text: string }] },
  ]
  providerOptions?: z.infer<typeof Options>
  abortSignal: AbortSignal
}

/**
 * The case's call through the model of its account kind, the credential it carries, and what the
 * recording names. Claude is offered the Hub's two web tools; Gemini none, as the Hub offers it only
 * `web_fetch` and its abort needs none.
 */
async function openerOf(args: Args) {
  if (args.provider === 'anthropic') {
    const { CONEXUS_RECORD_CLAUDE_TOKEN: token } = Claude.parse(process.env)
    const model = subscriptionModel(CLAUDE, token, 'conversation')
    return {
      open: (asked: Asked) => model.doStream({ ...asked, tools: WEB_TOOLS }),
      secrets: [token],
      modelId: ModelId.parse(`anthropic/${CLAUDE}`),
      meta: { api: 'Anthropic Messages API, streamed', sdk: versionOf('@ai-sdk/anthropic') },
    }
  }
  const env = Gemini.parse(process.env)
  const apiKey = env.CONEXUS_RECORD_CLIPROXY_KEY
  const url = env.CONEXUS_RECORD_CLIPROXY_URL
  const model = await callModel({ providerId: 'google', modelId: args.model, url, apiKey })
  return {
    open: (asked: Asked) => model.doStream(asked),
    secrets: [apiKey],
    modelId: ModelId.parse(`google/${args.model}`),
    meta: {
      api: 'Chat Completions through CLIProxyAPI, streamed',
      sdk: `${versionOf('@mastra/core')} (its OpenAI-compatible model)`,
    },
  }
}

/** Reads a copy of the body to its end, or to the client's cut, which ends the `abort` case. */
async function copied(body: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  const reader = body.getReader()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
  } catch (error) {
    console.log(`The stream was cut after ${chunks.length} chunks: ${String(error)}`)
  }
  return Buffer.concat(chunks)
}

/** Copies the one streamed body the SDK receives, and only its body: no header is kept (S40). */
function recordFetch(): { body: () => Promise<Buffer>; sent: () => string | undefined } {
  const real = globalThis.fetch
  let saved: Promise<Buffer> | undefined
  let sent: string | undefined
  globalThis.fetch = async (input, init) => {
    if (saved !== undefined) throw new Error('A recording holds one call; a second was asked.')
    sent = typeof init?.body === 'string' ? init.body : undefined
    const response = await real(input, init)
    if (!response.ok || response.body === null) {
      throw new Error(`The provider refused the call with ${response.status}; nothing is saved.`)
    }
    const [forSdk, forFile] = response.body.tee()
    saved = copied(forFile)
    return new Response(forSdk, { status: response.status, headers: response.headers })
  }
  return {
    sent: () => sent,
    body: () => {
      globalThis.fetch = real
      if (saved === undefined) throw new Error('The model made no call; nothing is saved.')
      return saved
    },
  }
}

const Chunk = z.object({
  choices: z.array(z.object({ delta: z.object({ reasoning_content: z.string().nullish() }) })),
})

/** The characters of `reasoning_content` the Chat Completions stream carried, in all its deltas. */
function reasoningCharsOf(sse: string): number {
  return sse
    .split('\n')
    .filter((line) => line.startsWith('data: {'))
    .flatMap((line) => Chunk.safeParse(JSON.parse(line.slice('data: '.length))).data?.choices ?? [])
    .reduce((sum, choice) => sum + (choice.delta.reasoning_content?.length ?? 0), 0)
}

async function record(args: Args) {
  const { open, secrets, modelId, meta } = await openerOf(args)
  const effort = args.case === 'thinking' ? 'low' : 'off'
  // The Gemini proof asks CLIProxy's OpenAI-compatible model for the level itself, as the wire's
  // `reasoning_effort`, to see what the proxy does with it (card 14.2, criterion 20).
  const providerOptions =
    args.provider === 'google' && args.effort !== undefined
      ? { google: { reasoningEffort: args.effort } }
      : Options.optional().parse(providerOptionsOf(modelId, effort))
  const cut = new AbortController()
  const recording = recordFetch()
  const { stream } = await open({
    prompt: [
      { role: 'system', content: 'Answer in Brazilian Portuguese.' },
      { role: 'user', content: [{ type: 'text', text: PROMPTS[args.case] }] },
    ],
    ...(providerOptions && { providerOptions }),
    abortSignal: AbortSignal.any([cut.signal, AbortSignal.timeout(CALL_MS)]),
  })
  let deltas = 0
  try {
    for await (const part of stream) {
      if (part.type === 'text-delta') deltas += 1
      if (args.case === 'abort' && deltas === ABORT_AFTER) cut.abort()
    }
  } catch (error) {
    if (!cut.signal.aborted) throw error
    console.log(`Stopped after ${deltas} text deltas, as the case asks.`)
  }
  const body = await recording.body()
  const text = body.toString('utf8')
  if (args.provider === 'google' && args.case === 'thinking') {
    const request = z
      .object({ model: z.string(), reasoning_effort: z.string().optional() })
      .parse(JSON.parse(recording.sent() ?? 'null'))
    const reasoned = reasoningCharsOf(text)
    console.log(
      `PROOF request model=${request.model} reasoning_effort=${request.reasoning_effort ?? 'absent'} reasoning_content_chars=${reasoned}`,
    )
    if (reasoned === 0) throw new Error('No reasoning_content came back; nothing is saved.')
  }
  if (secrets.some((secret) => text.includes(secret)) || LEAK.test(text)) {
    throw new Error('The body carries a credential, an address or a bearer; nothing is saved.')
  }
  const name = `${args.provider}-${args.case}`
  const today = new Date().toISOString().slice(0, 10)
  const provider = ProviderId.parse(args.provider)
  const described: Recording = { provider, ...meta, recordedAt: today }
  writeFileSync(join(RECORDINGS, `${name}.sse`), body)
  writeFileSync(join(RECORDINGS, `${name}.json`), `${JSON.stringify(described, null, 2)}\n`)
  console.log(`Saved ${name}.sse (${body.length} bytes) and ${name}.json.`)
}

/** The credential the case reads from the environment, and the kind that carries it. */
function listCredential(args: ModelsArgs) {
  const { provider } = args
  if (args.via === 'cliproxy') {
    const env = Gemini.parse(process.env)
    const target = { kind: 'google_cliproxy' as const, provider }
    return { secret: env.CONEXUS_RECORD_CLIPROXY_KEY, target, via: env.CONEXUS_RECORD_CLIPROXY_URL }
  }
  if (provider === 'anthropic') {
    const secret = ListKeys.shape.anthropic.parse(process.env).CONEXUS_RECORD_CLAUDE_TOKEN
    return { secret, target: { kind: 'claude_subscription' as const, provider }, via: undefined }
  }
  const secret =
    provider === 'openai'
      ? ListKeys.shape.openai.parse(process.env).CONEXUS_RECORD_OPENAI_KEY
      : ListKeys.shape.google.parse(process.env).CONEXUS_RECORD_GOOGLE_KEY
  return { secret, target: { kind: 'api_key' as const, provider }, via: undefined }
}

/** One GET of the provider's list, saved as the provider sent it, and nothing else of the exchange. */
async function recordModels(args: ModelsArgs) {
  const { secret, target, via } = listCredential(args)
  const request = listRequest(target, secret, via)
  if (request === undefined) throw new Error('This provider has no list reader.')
  const response = await fetch(request.url, {
    headers: request.headers,
    signal: AbortSignal.timeout(CALL_MS),
  })
  if (!response.ok) throw new Error(`The provider refused the list with ${response.status}.`)
  const text = await response.text()
  if (text.includes(secret) || LEAK.test(text)) {
    throw new Error('The list carries a credential, an address or a bearer; nothing is saved.')
  }
  const name = args.via === 'cliproxy' ? 'google-cliproxy-models' : `${args.provider}-models`
  const meta: Recording = {
    provider: ProviderId.parse(args.provider),
    api: `${args.provider}${args.via === 'cliproxy' ? ' through CLIProxy' : ''} model list, first page`,
    sdk: 'none: the Hub reads it with fetch',
    recordedAt: new Date().toISOString().slice(0, 10),
  }
  const schema = args.via === 'cliproxy' ? LIST_SCHEMAS.openai : LIST_SCHEMAS[args.provider]
  const kept = JSON.stringify(schema.parse(JSON.parse(text)), null, 2)
  writeFileSync(join(RECORDINGS, `${name}.list.json`), `${kept}\n`)
  writeFileSync(join(RECORDINGS, `${name}.json`), `${JSON.stringify(meta, null, 2)}\n`)
  console.log(`Saved ${name}.list.json (${text.length} bytes) and ${name}.json.`)
}

const { values } = parseArgs({
  options: {
    provider: { type: 'string' },
    case: { type: 'string' },
    via: { type: 'string' },
    model: { type: 'string' },
    effort: { type: 'string' },
  },
})
if (values.case === 'models') await recordModels(ModelsArgs.parse(values))
else await record(Args.parse(values))
