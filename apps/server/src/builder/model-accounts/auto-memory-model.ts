import type { AccountKind, ModelId } from '@conexus/hub-api'
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
 * The cheap Google model CLIProxy serves, for a conversation on that account: Mastra's own pick,
 * `gemini-2.5-flash`, is one the proxy does not list, so the call would fall to the conversation's model.
 */
const CLIPROXY_AUTO_MODELS = { ...AUTO_MODELS, google: 'google/gemini-3.5-flash-lite' }

/**
 * The model Mastra's `'auto'` picks for a conversation on `main`: the main provider's cheap model,
 * or `main` itself for a provider it does not know. `canUseProvider` (`@mastra/memory` 1.39.0)
 * keeps the server's environment out of it, so Gemini never outranks the conversation's provider.
 * None when the pick is not a model the picker offers, so the call follows the conversation's model.
 */
export function autoMemoryModel(main: ModelId, kind: AccountKind | undefined): ModelId | null {
  const autoModels = kind === 'google_cliproxy' ? CLIPROXY_AUTO_MODELS : AUTO_MODELS
  const pick = resolveAutoModelId(main, { autoModels, canUseProvider: () => false })
  return pick !== undefined && isChoosable(pick) ? ParsedModelId.parse(pick) : null
}
