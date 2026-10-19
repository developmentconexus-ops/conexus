import type { Provider } from '@conexus/hub-api'
import { ProviderId } from '@conexus/hub-api'
import { PROVIDER_REGISTRY, parseModelString } from '@mastra/core/llm'

// The router's registry, bundled in the installed @mastra/core (decision 0027): read in memory,
// never fetched; compose.yaml sets MASTRA_OFFLINE so no refresh ever runs (provider-registry.ts:40-43).
const REGISTRY = Object.entries(PROVIDER_REGISTRY)
// A `${VAR}` in a provider's URL is a field beside the key, such as an account id (decision 0049).
const URL_TEMPLATE = /\$\{[A-Z0-9_]+\}/
// Only the models.dev gateway resolves a provider from its key alone: Netlify's needs a site too.
const KEY_GATEWAY = 'models.dev'

/** The key-only providers of the registry, by id, as decision 0049's criterion 1 derives them. */
const KEY_PROVIDERS: ReadonlyMap<ProviderId, Provider> = new Map(
  REGISTRY.filter(
    ([, config]) => config.gateway === KEY_GATEWAY && !URL_TEMPLATE.test(config.url ?? ''),
  )
    .map(
      ([id, config]): Provider => ({
        id: ProviderId.parse(id),
        name: config.name,
        models: config.models,
      }),
    )
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
    .map((provider) => [provider.id, provider]),
)

/** The providers an account links to by its API key alone, with their models, by name. */
export function listKeyProviders(): Provider[] {
  return [...KEY_PROVIDERS.values()]
}

/** The key-only provider of this id, or nothing for one off the list. */
export function keyProviderOf(id: string): Provider | undefined {
  const parsed = ProviderId.safeParse(id)
  return parsed.success ? KEY_PROVIDERS.get(parsed.data) : undefined
}

// Every model of the registry by provider, the company's default may be any of them (founder, C4).
const MODELS = new Map(REGISTRY.map(([id, config]) => [id, new Set(config.models)]))

/** Whether `provider/model` names a model of the registry. */
export function isRegistryModel(model: string): boolean {
  const { provider, modelId } = parseModelString(model)
  return provider !== null && (MODELS.get(provider)?.has(modelId) ?? false)
}
