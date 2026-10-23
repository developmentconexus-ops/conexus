// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in claude/THIRD_PARTY_LICENSE.txt.
// The token budgets are from @mastra/code-sdk 1.14.0, src/providers/anthropic-thinking.ts
// (`ANTHROPIC_THINKING_BUDGET_TOKENS`) and google-thinking.ts (`GEMINI_25_BUDGETS`). Which levels a
// model takes, and how it is asked, comes from Mastra's reasoning data; whether a Claude model can
// stop reasoning comes from the Anthropic provider's own model capabilities.

import { getModelCapabilities } from '@ai-sdk/anthropic/internal'
import type { ModelId } from '@conexus/hub-api'
import { Effort, runningEffort } from '@conexus/hub-api'
import type { ModelReasoningOption } from '@mastra/core/llm'
import { getModelReasoningOptions, PROVIDER_REGISTRY, parseModelString } from '@mastra/core/llm'
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
  /** What turns its reasoning off, and `null` for a model that always reasons. */
  off: { asked: ProviderOptions | undefined } | null
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
  return {
    provider,
    levels: [first, ...rest],
    byEffort: efforts.length > 0,
    tokens,
    off: offOf(model, provider, options, listed),
  }
}

/**
 * How the model stops reasoning. Claude has no default to lean on: a model that thinks unless told
 * otherwise (Haiku 5.5) keeps thinking when `thinking` is absent, so it is told `disabled`, and a
 * model the provider says rejects `disabled` always reasons. OpenAI lists a `none` effort; Gemini
 * takes a zero budget when Mastra's data gives it a toggle or its budget starts at zero.
 */
function offOf(
  model: ModelId,
  provider: ThinkingProvider,
  options: readonly ModelReasoningOption[],
  listed: readonly string[],
): Reasoning['off'] {
  switch (provider) {
    case 'anthropic':
      return getModelCapabilities(parseModelString(model).modelId).rejectsThinkingDisabled
        ? null
        : { asked: { anthropic: { thinking: { type: 'disabled' } } } }
    case 'openai':
      return listed.includes('none') ? { asked: { openai: { reasoningEffort: 'none' } } } : null
    case 'google': {
      const zero = options.some(
        (option) =>
          option.type === 'toggle' || (option.type === 'budget_tokens' && option.min === 0),
      )
      return zero ? { asked: { google: { thinkingConfig: { thinkingBudget: 0 } } } } : null
    }
    default:
      return provider satisfies never
  }
}

// CLIProxy names a Gemini model with the level it was built for (`gemini-3.8-flash-high`), but one
// name takes every level: its OpenAI-compatible route reasons only when the request carries
// `reasoning_effort`, and answers no reasoning without it (card 14.2, criterion 20, recorded in
// `google-thinking`). So the name is one model, and the level rides in the request.
const PROXY_LEVELS = ['low', 'medium', 'high'] as const satisfies readonly Active[]
const PROXY_NAME = new RegExp(`-(${PROXY_LEVELS.join('|')})$`)
const LISTED: ReadonlySet<string> = new Set(
  Object.entries(PROVIDER_REGISTRY).flatMap(([id, config]) =>
    config.models.map((model) => `${id}/${model}`),
  ),
)

/** A Google model under the name CLIProxy serves it by, which the registry lacks. */
function isProxied(model: ModelId): boolean {
  return (
    !LISTED.has(model) && parseModelString(model).provider === 'google' && PROXY_NAME.test(model)
  )
}

/** The name CLIProxy serves a model by, without the level it carries: the model it is one of. */
export function proxiedBase(model: ModelId): string {
  return isProxied(model) ? model.replace(PROXY_NAME, '') : model
}

/**
 * The efforts a model accepts, from Mastra's reasoning data, lowest first: `off` only when the
 * model can stop reasoning. A Gemini model under CLIProxy's name takes every level it serves, and
 * `off` as no request for one; a model with no reasoning control takes `off` alone.
 */
export function effortsOf(model: ModelId): [Effort, ...Effort[]] {
  const reasoning = reasoningOf(model)
  if (reasoning !== undefined) return effortsIn(reasoning)
  return isProxied(model) ? ['off', ...PROXY_LEVELS] : ['off']
}

function effortsIn(reasoning: Reasoning): [Effort, ...Effort[]] {
  return reasoning.off === null ? [...reasoning.levels] : ['off', ...reasoning.levels]
}

/**
 * The level a conversation on `model` starts at when `wanted` is kept: the same if the model takes
 * it, else the nearest below it, else the model's lowest (`runningEffort`, one rule for the start
 * and for the step).
 */
export function effortFor(model: ModelId, wanted: Effort): Effort {
  return runningEffort(effortsOf(model), wanted)
}

/**
 * What one step asks the provider so the model reasons at `effort`, or at the level it runs at
 * instead (`runningEffort`: another model after the automatic switch may take fewer, or always
 * reason).
 */
export function providerOptionsOf(model: ModelId, effort: Effort): ProviderOptions | undefined {
  const reasoning = reasoningOf(model)
  if (reasoning === undefined) {
    if (!isProxied(model)) return undefined
    const asked = runningEffort(effortsOf(model), effort)
    return asked === 'off' ? undefined : { google: { reasoningEffort: asked } }
  }
  const level = runningEffort(effortsIn(reasoning), effort)
  if (level === 'off') return reasoning.off?.asked
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
