// `npm run record-provider -- --provider anthropic|openai|google --case models` (see record-provider.ts)
// saves the first page of the model list the provider gives the credential (CONEXUS_RECORD_CLAUDE_TOKEN,
// CONEXUS_RECORD_OPENAI_KEY or CONEXUS_RECORD_GOOGLE_KEY); with `--via cliproxy` (google only) the list
// of the local CLIProxy (CONEXUS_RECORD_CLIPROXY_URL, CONEXUS_RECORD_CLIPROXY_KEY): one GET, authorized
// by the founder's "A" of 2026-10-21 (step 12.3). Moved out of record-provider.ts unchanged.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ProviderId } from '@conexus/hub-api'
import { z } from 'zod'
import {
  AnthropicPage,
  GooglePage,
  listRequest,
  OpenAiList,
} from '../apps/server/src/builder/model-accounts/public.ts'
import type { Recording } from '../apps/server/src/platform/test-recordings.ts'
import { LEAK, RECORDINGS } from '../apps/server/src/platform/test-recordings.ts'

/** The whole call's budget (code C57). */
const CALL_MS = 120_000

export const CliProxy = z.object({
  CONEXUS_RECORD_CLIPROXY_URL: z.url(),
  CONEXUS_RECORD_CLIPROXY_KEY: z.string().min(1),
})

// The model lists (card 12.3, review 1b): `--case models` saves the first page of what the provider
// lists for the credential, to check the schemas the Hub reads it with against the real answer.
export const ModelsArgs = z.object({
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
type ModelsArgs = z.infer<typeof ModelsArgs>

/** The credential the case reads from the environment, and the kind that carries it. */
function listCredential(args: ModelsArgs) {
  const { provider } = args
  if (args.via === 'cliproxy') {
    const env = CliProxy.parse(process.env)
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
export async function recordModels(args: ModelsArgs) {
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
