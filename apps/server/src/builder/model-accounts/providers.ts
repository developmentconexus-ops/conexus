import type { Provider } from '@conexus/hub-api'
import { ModelId, ProviderId } from '@conexus/hub-api'
import type { ProviderConfig } from '@mastra/core/llm'
import { PROVIDER_REGISTRY } from '@mastra/core/llm'
import { effortsOf } from './thinking.ts'

// The router's registry, bundled in the installed @mastra/core (decision 0027): read in memory,
// never fetched; compose.yaml sets MASTRA_OFFLINE so no refresh ever runs (provider-registry.ts:40-43).
const REGISTRY = Object.entries(PROVIDER_REGISTRY)
// A `${VAR}` in a provider's URL is a field beside the key, such as an account id (decision 0049).
const URL_TEMPLATE = /\$\{[A-Z0-9_]+\}/
// Only the models.dev gateway resolves a provider from its key alone: Netlify's needs a site too.
const KEY_GATEWAY = 'models.dev'
// Mastra 1.78.0 says nothing of what a model outputs: its capabilities are attachments,
// temperature, structured output and reasoning. So a model that draws, films, speaks, hears,
// embeds, ranks, guards, reads scans or talks live is left out by a word of its name, as the old Hub
// did (Conexus OS `model-accounts.ts`, 729bdc5d); the words come from every key provider's list.
const NOT_CHAT = new RegExp(
  `(^|[-_./:@])(${[
    'image|imagen|imagine|dall-e|flux|sdxl|stable-diffusion|stablediffusionxl|seedream|recraft|ideogram',
    'video|veo|sora|seedance|kling|wan|wanx|t2v|i2v|r2v|heygen',
    'audio|music|lyria|tts|speech|voice|voicechat|studiovoice|orpheus|elevenlabs|voxtral|whisper|transcribe|asr|stt',
    'embed|embedding|embedcode|bge|e5|rerank|reranker',
    'guard|safeguard|gliguard|qwen3guard|moderation|detector',
    'ocr|paddleocr|deepseek-ocr|lightonocr',
    'realtime|live|computer-use|deep-research|gemini-omni',
  ].join('|')})(?=$|[-_./:@\\d])`,
  'i',
)

/** The models of a provider a conversation can talk to: not retired, and able to chat. */
function chatModelsOf(config: ProviderConfig): string[] {
  const retired = new Set(config.deprecatedModels ?? [])
  return config.models.filter((model) => !retired.has(model) && !NOT_CHAT.test(model))
}

/** The key-only providers of the registry, by id, as decision 0049's criterion 1 derives them. */
const KEY_PROVIDERS: ReadonlyMap<ProviderId, Provider> = new Map(
  REGISTRY.filter(
    ([, config]) => config.gateway === KEY_GATEWAY && !URL_TEMPLATE.test(config.url ?? ''),
  )
    .map(
      ([id, config]): Provider => ({
        id: ProviderId.parse(id),
        name: config.name,
        models: chatModelsOf(config).map((model) => {
          const modelId = ModelId.parse(`${id}/${model}`)
          return { id: modelId, efforts: effortsOf(modelId) }
        }),
      }),
    )
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
    .map((provider) => [provider.id, provider]),
)

/** The providers an account links to by its API key alone, with their models and efforts, by name. */
export function listKeyProviders(): Provider[] {
  return [...KEY_PROVIDERS.values()]
}

/** The key-only provider of this id, or nothing for one off the list. */
export function keyProviderOf(id: string): Provider | undefined {
  const parsed = ProviderId.safeParse(id)
  return parsed.success ? KEY_PROVIDERS.get(parsed.data) : undefined
}

// Every model a person may choose, the very list the picker reads (`chatModelsOf` of each key
// provider): one owner of "a model one may choose" (code C26), so a default or a start never names
// a retired or non-chat model the picker does not offer.
const CHOOSABLE: ReadonlySet<string> = new Set(
  [...KEY_PROVIDERS.values()].flatMap((provider) => provider.models.map((model) => model.id)),
)

/** Whether `provider/model` is a model the picker offers. */
export function isChoosable(model: string): boolean {
  return CHOOSABLE.has(model)
}

/**
 * The models a conversation starts on when neither the person nor the company chose one (P3): the
 * first with a usable account. Each is a model of the registry, which a test checks.
 */
export const STARTER_MODELS: readonly ModelId[] = [
  ModelId.parse('anthropic/claude-sonnet-5-5'),
  ModelId.parse('openai/gpt-5'),
  ModelId.parse('google/gemini-2.5-pro'),
]
