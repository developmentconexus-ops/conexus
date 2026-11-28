import type { ModelId } from '@conexus/hub-api'
import { ModelId as ParsedModelId } from '@conexus/hub-api'
import { resolveAutoModelId } from '@mastra/memory'
import { isChoosable } from './providers.ts'

/**
 * The cheap models for the Observer and Reflector where Mastra's own pick is not the one to use:
 * Anthropic's Haiku the picker lists, where Mastra's (`claude-haiku-4-5`) is the previous one, and
 * Google's `gemini-3.5-flash-lite`, which both Google paths serve and the picker lists, where
 * Mastra's `gemini-2.5-flash` is retired (`@mastra/memory` 1.41.3 `dist/src-C6oJP8WI.js:24170`) and
 * would fall to the conversation's model. Every other provider keeps Mastra's pick, as Mastra Code
 * does (`packs.ts:338-353`).
 */
const AUTO_MODELS = {
  anthropic: 'anthropic/claude-haiku-5-5',
  google: 'google/gemini-3.5-flash-lite',
}

/**
 * The model Mastra's `'auto'` picks for a conversation on `main`: the main provider's cheap model,
 * or `main` itself for a provider it does not know. `canUseProvider` (`@mastra/memory` 1.39.0)
 * keeps the server's environment out of it, so Gemini never outranks the conversation's provider.
 * None when the pick is not a model the picker offers, so the call follows the conversation's model.
 */
export function autoMemoryModel(main: ModelId): ModelId | null {
  const pick = resolveAutoModelId(main, { autoModels: AUTO_MODELS, canUseProvider: () => false })
  return pick !== undefined && isChoosable(pick) ? ParsedModelId.parse(pick) : null
}
