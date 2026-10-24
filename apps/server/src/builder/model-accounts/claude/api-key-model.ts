import { createAnthropic } from '@ai-sdk/anthropic'
import { wrapLanguageModel } from 'ai'
import type { PromptCacheScope } from './prompt-cache.ts'
import { promptCacheMiddleware } from './prompt-cache.ts'

/** An API key's Claude model, built as Mastra Code builds it so the cache marks can wrap it (the router's model is v2). */
export function apiKeyModel(modelName: string, apiKey: string, scope: PromptCacheScope) {
  return wrapLanguageModel({
    model: createAnthropic({ apiKey })(modelName),
    middleware: promptCacheMiddleware(scope),
    providerId: 'anthropic',
  })
}
