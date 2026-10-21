// Defect: a provider double answers in a shape the real provider never sends, so a test passes on
// a part the screen wants and the real stream breaks it (testing T24, PR 191).
// `npm run record-provider -- --provider anthropic|google --case cited|thinking|tool-error|abort`
// runs one model call through the same model the Hub builds for the account kind, Claude's
// subscription (`subscriptionModel`) or Gemini through CLIProxy (`callModel` with its URL), and
// saves the body the installed SDK received in apps/server/src/platform/recordings/, with the
// provider, API, SDK version and date beside it. The credential comes from the environment only
// and never reaches a file or the output (security S40): CONEXUS_RECORD_CLAUDE_TOKEN for Claude,
// CONEXUS_RECORD_CLIPROXY_URL and CONEXUS_RECORD_CLIPROXY_KEY for Gemini. Every prompt is invented.
// Gemini records only `abort`: its thinking waits for #172, its search for #150. Authorized once,
// by the founder's "2A" of 2026-10-20.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { ModelId, ProviderId } from '@conexus/hub-api'
import { z } from 'zod'
import {
  callModel,
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
/** The deltas an `abort` case lets through before it stops the call, as a person's stop would. */
const ABORT_AFTER = 4
/** The whole call's budget (code C57). */
const CALL_MS = 120_000

const Args = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('anthropic'),
    case: z.enum(['cited', 'thinking', 'tool-error', 'abort']),
  }),
  z.object({ provider: z.literal('google'), case: z.literal('abort') }),
])
type Args = z.infer<typeof Args>

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
    const model = subscriptionModel(CLAUDE, token)
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
  const model = await callModel({ providerId: 'google', modelId: GEMINI, url, apiKey })
  return {
    open: (asked: Asked) => model.doStream(asked),
    secrets: [apiKey],
    modelId: ModelId.parse(`google/${GEMINI}`),
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
function recordFetch(): { body: () => Promise<Buffer> } {
  const real = globalThis.fetch
  let saved: Promise<Buffer> | undefined
  globalThis.fetch = async (input, init) => {
    if (saved !== undefined) throw new Error('A recording holds one call; a second was asked.')
    const response = await real(input, init)
    if (!response.ok || response.body === null) {
      throw new Error(`The provider refused the call with ${response.status}; nothing is saved.`)
    }
    const [forSdk, forFile] = response.body.tee()
    saved = copied(forFile)
    return new Response(forSdk, { status: response.status, headers: response.headers })
  }
  return {
    body: () => {
      globalThis.fetch = real
      if (saved === undefined) throw new Error('The model made no call; nothing is saved.')
      return saved
    },
  }
}

async function record(args: Args) {
  const { open, secrets, modelId, meta } = await openerOf(args)
  const effort = args.case === 'thinking' ? 'low' : 'off'
  const providerOptions = Options.optional().parse(providerOptionsOf(modelId, effort))
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

const { values } = parseArgs({
  options: { provider: { type: 'string' }, case: { type: 'string' } },
})
await record(Args.parse(values))
