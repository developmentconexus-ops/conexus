import type { ModelId } from '@conexus/hub-api'
import { ModelId as ParsedModelId } from '@conexus/hub-api'
import { resolveAutoModelId } from '@mastra/memory'
import { isChoosable } from './providers.ts'

/**
 * Anthropic's cheap model for the Observer and Reflector: the Haiku the picker lists, where Mastra's
 * own pick (`auto-model.ts:7-13`, `claude-haiku-4-5`) is the previous one. Every other provider keeps
 * Mastra's pick, as Mastra Code does (`packs.ts:338-353`).
 */
const AUTO_MODELS = { anthropic: 'anthropic/claude-haiku-5-5' }

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
