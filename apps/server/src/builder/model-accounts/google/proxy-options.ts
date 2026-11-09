import type { LanguageModel } from '@mastra/core/llm'
import { Failure } from '../../../platform/failure.ts'

type Options = { providerOptions?: Record<string, Record<string, unknown>> }

/**
 * The CLIProxy account's model is OpenAI-compatible under the name `google`, which copies every key
 * of `providerOptions.google` it does not know into the request body (`@mastra/core@1.82.0`
 * `netlify-*.js:3290-3294`). Mastra's own default for the Observer and the Reflector, Google's native
 * `thinkingConfig`, so reaches the proxy as a loose field. It leaves here; the effort the proxy
 * takes is `reasoningEffort` (`thinking.ts`), which stays as the call set it.
 */
function withoutThinkingConfig<Sent extends Options>(options: Sent): Sent {
  const google = options.providerOptions?.google
  if (google === undefined || !('thinkingConfig' in google)) return options
  const { thinkingConfig: _asked, ...kept } = google
  return { ...options, providerOptions: { ...options.providerOptions, google: kept } }
}

/**
 * The model a `google_cliproxy` account resolves to, asking the proxy without `thinkingConfig`. The
 * router's model is v2 (`ModelRouterLanguageModel`, `llm-*.js:8611`) and `wrapLanguageModel` takes v3
 * only, so the two calls are wrapped here, as `watched` wraps a v3 model. Another version is refused,
 * so a Mastra that changes it stops here and not on the wire.
 */
export function proxied(model: LanguageModel): LanguageModel {
  if (typeof model === 'string' || model.specificationVersion !== 'v2') {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'CLIPROXY_MODEL_NOT_V2' } })
  }
  return {
    specificationVersion: 'v2',
    provider: model.provider,
    modelId: model.modelId,
    supportedUrls: model.supportedUrls,
    id: model.id,
    doGenerate: (options) => model.doGenerate(withoutThinkingConfig(options)),
    doStream: (options) => model.doStream(withoutThinkingConfig(options)),
  }
}
