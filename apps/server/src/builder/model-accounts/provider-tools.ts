import type { ModelId } from '@conexus/hub-api'
import { providerOf } from './queue.ts'

const WEB_SEARCH = 'web_search'
const WEB_FETCH = 'web_fetch'

/**
 * The tools a switch to another model takes out: the provider's own belong to the model the
 * conversation chose, `left`. Only Anthropic's `web_fetch` is the provider's; the other providers'
 * is Mastra's function, which any model runs.
 */
export function minusProviderTools(active: string[], left: ModelId): string[] {
  const gone = providerOf(left) === 'anthropic' ? [WEB_SEARCH, WEB_FETCH] : [WEB_SEARCH]
  return active.filter((name) => !gone.includes(name))
}
