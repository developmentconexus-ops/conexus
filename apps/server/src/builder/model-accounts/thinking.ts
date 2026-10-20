// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in claude/THIRD_PARTY_LICENSE.txt.
// The token budgets are from @mastra/code-sdk 1.14.0, src/providers/anthropic-thinking.ts
// (`ANTHROPIC_THINKING_BUDGET_TOKENS`) and google-thinking.ts (`GEMINI_25_BUDGETS`). Which levels a
// model takes, and how it is asked, comes only from Mastra's reasoning data.

import type { ModelId } from '@conexus/hub-api'
import { Effort } from '@conexus/hub-api'
import { getModelReasoningOptions, parseModelString } from '@mastra/core/llm'
import type { ProcessInputStepResult } from '@mastra/core/processors'
import type { z } from 'zod'

const ActiveEffort = Effort.exclude(['off'])
type Active = z.infer<typeof ActiveEffort>
export type ProviderOptions = NonNullable<ProcessInputStepResult['providerOptions']>

const ACTIVE = ActiveEffort.options
const BUDGET_TOKENS = {
  // Counts toward max_tokens: stays under the 32k output cap of Opus 4.0 and 4.1.
  anthropic: { low: 4096, medium: 8192, high: 16384, xhigh: 24576, max: 24576 },
  google: { low: 1024, medium: 8192, high: 24576, xhigh: 24576, max: 24576 },
} as const satisfies Record<string, Record<Active, number>>
const THINKING_PROVIDERS = ['anthropic', 'google', 'openai'] as const
type ThinkingProvider = (typeof THINKING_PROVIDERS)[number]

/** How a model reasons, as Mastra's data (`getModelReasoningOptions`) lists it. */
type Reasoning = {
  provider: ThinkingProvider
  /** The levels the model takes, in order: the efforts it lists, or else one per budget. */
  levels: readonly [Active, ...Active[]]
  /** The model lists `effort` values, so the provider takes the level itself. */
  byEffort: boolean
  /** The tokens a level thinks with, when the model lists a token budget. */
  tokens: ((level: Active) => number) | undefined
}

function isThinking(provider: string | null): provider is ThinkingProvider {
  return THINKING_PROVIDERS.some((each) => each === provider)
}

function reasoningOf(model: ModelId): Reasoning | undefined {
  const { provider } = parseModelString(model)
  if (!isThinking(provider)) return undefined
  const options = getModelReasoningOptions(model) ?? []
  const listed = options.flatMap((option) => (option.type === 'effort' ? option.values : []))
  const efforts = ACTIVE.filter((level) => listed.includes(level))
  const [budget] = options.flatMap((option) => (option.type === 'budget_tokens' ? [option] : []))
  const table = provider === 'openai' ? undefined : BUDGET_TOKENS[provider]
  const tokens =
    budget === undefined || table === undefined
      ? undefined
      : (level: Active) =>
          Math.min(Math.max(table[level], budget.min ?? 0), budget.max ?? Number.POSITIVE_INFINITY)
  const budgets =
    tokens === undefined
      ? []
      : ACTIVE.filter((level) => ACTIVE.find((each) => tokens(each) === tokens(level)) === level)
  const [first, ...rest] = efforts.length > 0 ? efforts : budgets
  if (first === undefined) return undefined
  return { provider, levels: [first, ...rest], byEffort: efforts.length > 0, tokens }
}

/** The level the model runs at for `level`: the same, or the nearest below it, or its lowest. */
function runLevel(reasoning: Reasoning, level: Active): Active {
  const rank = ACTIVE.indexOf(level)
  const below = reasoning.levels.filter((each) => ACTIVE.indexOf(each) <= rank)
  return below.at(-1) ?? reasoning.levels[0]
}

/** The efforts a model accepts, from Mastra's reasoning data; `off` always. */
export function effortsOf(model: ModelId): Effort[] {
  return ['off', ...(reasoningOf(model)?.levels ?? [])]
}

/**
 * What one step asks the provider so the model reasons at `effort`, or at the nearest level it
 * takes (another model after the automatic switch may take fewer); nothing for `off`.
 */
export function providerOptionsOf(model: ModelId, effort: Effort): ProviderOptions | undefined {
  const reasoning = reasoningOf(model)
  if (effort === 'off' || reasoning === undefined) return undefined
  const level = runLevel(reasoning, effort)
  const { tokens, byEffort } = reasoning
  switch (reasoning.provider) {
    case 'anthropic':
      // Adaptive thinking is Claude 4.6's and later's; a model that still lists a budget gets it.
      return tokens === undefined
        ? { anthropic: { thinking: { type: 'adaptive', display: 'summarized' }, effort: level } }
        : {
            anthropic: {
              thinking: { type: 'enabled', budgetTokens: tokens(level) },
              ...(byEffort && { effort: level }),
            },
          }
    case 'google':
      return {
        google: {
          thinkingConfig:
            byEffort || tokens === undefined
              ? { thinkingLevel: level }
              : { thinkingBudget: tokens(level) },
        },
      }
    case 'openai':
      return { openai: { reasoningEffort: level } }
    default:
      return reasoning.provider satisfies never
  }
}
