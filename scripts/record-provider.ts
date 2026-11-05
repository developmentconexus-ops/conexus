// Defect: a provider double answers in a shape the real provider never sends, so a test passes on
// a part the screen wants and the real stream breaks it (testing T24, PR 191).
// `npm run record-provider -- --provider anthropic|google --case cited|thinking|tool-error|abort`
// runs one model call through the same model the Hub builds for the account kind, Claude's
// subscription (`subscriptionModel`) or Gemini through CLIProxy (`callModel` with its URL), and
// saves the body the installed SDK received in apps/server/src/platform/recordings/, with the
// provider, API, SDK version and date beside it. The credential comes from the environment only
// and never reaches a file or the output (security S40): CONEXUS_RECORD_CLAUDE_TOKEN for Claude,
// CONEXUS_RECORD_CLIPROXY_URL and CONEXUS_RECORD_CLIPROXY_KEY for Gemini. Every prompt is invented.
// `--provider openai-codex --case thinking|abort|tool-error|unserved` does the same through the ChatGPT
// subscription's model (`codexModel`), with CONEXUS_RECORD_CODEX_ACCESS and CONEXUS_RECORD_CODEX_ACCOUNT
// (a signed-in account's access token and ChatGPT account id) in the environment and `--model` naming a
// registry OpenAI model. The recordings are `openai-codex-<case>` with provider `openai`. `unserved`
// writes no file: it asks for a model the subscription does not serve and prints the status and the
// error code the endpoint answers, for the decision's result.
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
  callModel,
  codexModel,
  providerOptionsOf,
  subscriptionModel,
} from '../apps/server/src/builder/model-accounts/public.ts'
import type { Recording } from '../apps/server/src/platform/test-recordings.ts'
import { LEAK, RECORDINGS } from '../apps/server/src/platform/test-recordings.ts'
import { CliProxy, ModelsArgs, recordModels } from './record-models.ts'

const ROOT = join(import.meta.dirname, '..')
// The subscription no longer serves Claude Sonnet 4.5; 4.6 is the nearest it
// serves, and it still answers with thinking off, as the Hub's `off` asks.
const CLAUDE = 'claude-sonnet-4-6'
// The local CLIProxy's Gemini model that the router's registry also knows.
const GEMINI = 'gemini-3.5-flash-lite'
// An OpenAI model of the registry that the Codex endpoint is known to serve.
const CODEX = 'gpt-5.2'
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
  z.object({
    provider: z.literal('openai-codex'),
    case: z.enum(['thinking', 'abort', 'tool-error', 'unserved']),
    model: z.string().min(1).default(CODEX),
  }),
])
type Args = z.infer<typeof Args>
const Claude = z.object({ CONEXUS_RECORD_CLAUDE_TOKEN: z.string().min(1) })
const Codex = z.object({
  CONEXUS_RECORD_CODEX_ACCESS: z.string().min(1),
  CONEXUS_RECORD_CODEX_ACCOUNT: z.string().min(1),
})

/** The invented question each case asks, in Portuguese as a person of the company would. */
const PROMPTS: Record<Args['case'], string> = {
  cited:
    'Pesquise na web duas receitas de pão de queijo e diga, em duas frases, o que cada uma usa, citando as fontes.',
  thinking:
    'Uma padaria inventada vende 120 pães por dia a R$ 0,80 cada. Quanto ela fatura em 30 dias? Pense antes de responder.',
  'tool-error':
    'Leia a página http://padaria-inventada.example.test/cardapio e diga o que ela vende.',
  unserved: 'Diga olá em uma frase.',
  abort: 'Escreva uma lista de 60 nomes inventados de padarias, um por linha, sem comentários.',
}

/** The Hub's two web tools as the Messages API receives them from Mastra's `webFetchTool` and `webSearchTool`. */
const WEB_FETCH = {
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
}
const WEB_TOOLS = [
  WEB_FETCH,
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
      meta: {
        provider: ProviderId.parse('anthropic'),
        api: 'Anthropic Messages API, streamed',
        sdk: versionOf('@ai-sdk/anthropic'),
      },
    }
  }
  if (args.provider === 'openai-codex') {
    const env = Codex.parse(process.env)
    const access = env.CONEXUS_RECORD_CODEX_ACCESS
    const model = codexModel(args.model, { access, accountId: env.CONEXUS_RECORD_CODEX_ACCOUNT })
    return {
      open: (asked: Asked) => model.doStream({ ...asked, tools: [WEB_FETCH] }),
      secrets: [access, env.CONEXUS_RECORD_CODEX_ACCOUNT],
      modelId: ModelId.parse(`openai/${args.model}`),
      meta: {
        provider: ProviderId.parse('openai'),
        api: 'ChatGPT Codex Responses API, streamed',
        sdk: versionOf('@ai-sdk/openai'),
      },
    }
  }
  const env = CliProxy.parse(process.env)
  const apiKey = env.CONEXUS_RECORD_CLIPROXY_KEY
  const url = env.CONEXUS_RECORD_CLIPROXY_URL
  const model = await callModel({ providerId: 'google', modelId: args.model, url, apiKey })
  return {
    open: (asked: Asked) => model.doStream(asked),
    secrets: [apiKey],
    modelId: ModelId.parse(`google/${args.model}`),
    meta: {
      provider: ProviderId.parse('google'),
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

// The AI SDK's `APICallError` as far as this script reads it.
const CallError = z.object({
  statusCode: z.number().optional(),
  responseBody: z.string().optional(),
})
const ErrorReply = z.object({ error: z.object({ code: z.string().nullish() }) })

/** What the endpoint answers for a model the subscription does not serve: the status and the error code. */
async function recordUnserved(args: Args) {
  const { open } = await openerOf(args)
  try {
    await open({
      prompt: [
        { role: 'system', content: 'Answer in Brazilian Portuguese.' },
        { role: 'user', content: [{ type: 'text', text: PROMPTS.unserved }] },
      ],
      abortSignal: AbortSignal.timeout(CALL_MS),
    })
  } catch (error) {
    const refusal = CallError.safeParse(error)
    if (!refusal.success) throw error
    const reply = ErrorReply.safeParse(JSON.parse(refusal.data.responseBody ?? 'null'))
    console.log(
      `UNSERVED status=${refusal.data.statusCode ?? 'none'} code=${reply.data?.error.code ?? 'none'}`,
    )
    return
  }
  throw new Error('The endpoint served the model; choose one the subscription does not serve.')
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
  const described: Recording = { ...meta, recordedAt: today }
  writeFileSync(join(RECORDINGS, `${name}.sse`), body)
  writeFileSync(join(RECORDINGS, `${name}.json`), `${JSON.stringify(described, null, 2)}\n`)
  console.log(`Saved ${name}.sse (${body.length} bytes) and ${name}.json.`)
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
else {
  const args = Args.parse(values)
  if (args.case === 'unserved') await recordUnserved(args)
  else await record(args)
}
