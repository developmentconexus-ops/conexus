// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in claude/THIRD_PARTY_LICENSE.txt.
// From @mastra/code-sdk 1.15.0-alpha.3 (mastra-ai/mastra 9d2e7398), mastracode/sdk/src/thinking.ts
// (`runThinkingLevel`, `getAvailableThinkingLevelsForModel`) and src/providers/anthropic-thinking.ts,
// google-thinking.ts and claude-max.ts (the Anthropic options).
// Changed: Anthropic, Google and OpenAI only; a model Mastra has no reasoning data for takes no
// effort; the level becomes the provider's options for one step instead of a model middleware.

import type { ModelId } from '@conexus/hub-api'
import { Effort } from '@conexus/hub-api'
import type { ModelReasoningOption } from '@mastra/core/llm'
import { getModelReasoningOptions, parseModelString } from '@mastra/core/llm'
import type { ProcessInputStepResult } from '@mastra/core/processors'
import type { z } from 'zod'

const ActiveEffort = Effort.exclude(['off'])
type Active = z.infer<typeof ActiveEffort>
export type ProviderOptions = NonNullable<ProcessInputStepResult['providerOptions']>

const THINKING_PROVIDERS: ReadonlySet<string> = new Set(['anthropic', 'google', 'openai'])
const ACTIVE = ActiveEffort.options

// Counts toward max_tokens: stays under the 32k output cap of Opus 4.0 and 4.1.
const ANTHROPIC_BUDGET_TOKENS: Record<Active, number> = {
  low: 4096,
  medium: 8192,
  high: 16384,
  xhigh: 24576,
  max: 24576,
}
const ANTHROPIC_XHIGH_EFFORT = /claude-(?:opus-4-[78]|opus-5|sonnet-5|fable-5)/
const ANTHROPIC_ADAPTIVE = /claude-(?:sonnet-4-6|opus-4-[678]|opus-5|sonnet-5|fable-5)/
const ANTHROPIC_BUDGET = /claude-(?:3-7|sonnet-4|opus-4|haiku-4-5)/
const ANTHROPIC_NONE = /claude-(?:instant|v?2(?:[-.:]|$)|3(?:[-.]|$)|3-5)/

type GeminiLevel = 'low' | 'medium' | 'high'
type GeminiFamily = 'budget' | 'low-high' | 'minimal-high' | 'levels'
// Within the smallest Gemini 2.5 maximum, 24576 for Flash and Flash-Lite.
const GEMINI_25_BUDGETS: Record<GeminiLevel, number> = { low: 1024, medium: 8192, high: 24576 }

const GPT_VERSION = /^gpt-(\d+)(?:\.(\d+))?/

function anthropicCapability(name: string): 'adaptive' | 'budget' | 'none' {
  if (ANTHROPIC_ADAPTIVE.test(name)) return 'adaptive'
  if (ANTHROPIC_BUDGET.test(name)) return 'budget'
  if (ANTHROPIC_NONE.test(name)) return 'none'
  return 'adaptive'
}

function geminiFamily(name: string): GeminiFamily | undefined {
  const id = name.toLowerCase()
  if (id.startsWith('gemini-2.5')) return 'budget'
  // Only Gemini 3 Pro lacks `medium`; Gemini 3.1 Pro accepts it.
  if (id.startsWith('gemini-3-pro')) return 'low-high'
  if (id.startsWith('gemini-3.1-flash-image') || id.startsWith('gemini-3.1-flash-lite-image'))
    return 'minimal-high'
  if (/^gemini-\d/.test(id) && !id.startsWith('gemini-1') && !id.startsWith('gemini-2'))
    return 'levels'
  return undefined
}

function geminiLevel(family: GeminiFamily, level: Active): GeminiLevel {
  const capped = level === 'xhigh' || level === 'max' ? 'high' : level
  const noMedium = family === 'low-high' || family === 'minimal-high'
  return noMedium && capped === 'medium' ? 'high' : capped
}

function supportsMaxReasoningEffort(name: string): boolean {
  const match = GPT_VERSION.exec(name)
  if (!match) return false
  const major = Number(match[1])
  const minor = Number(match[2] ?? 0)
  return major > 5 || (major === 5 && minor >= 6)
}

/** The effort Mastra lists for the model at `level`, or the nearest below it, or its lowest. */
function closestOffered(level: Active, options: readonly ModelReasoningOption[]) {
  const values = options.flatMap((option) => (option.type === 'effort' ? option.values : []))
  const offered = ACTIVE.filter((each) => values.includes(each))
  const rank = ACTIVE.indexOf(level)
  return offered.filter((each) => ACTIVE.indexOf(each) <= rank).at(-1) ?? offered[0]
}

/** The lowest level that asks Anthropic for the same budget, so two levels of one budget are one. */
function lowestOfBudget(level: Active): Active {
  const budget = ANTHROPIC_BUDGET_TOKENS[level]
  return ACTIVE.find((each) => ANTHROPIC_BUDGET_TOKENS[each] === budget) ?? level
}

function anthropicLevel(name: string, level: Active, options: readonly ModelReasoningOption[]) {
  const capability = anthropicCapability(name)
  if (capability === 'none') return 'off'
  if (capability === 'budget') return lowestOfBudget(level)
  const offered = closestOffered(level, options)
  if (offered !== undefined) return offered
  return level === 'xhigh' && !ANTHROPIC_XHIGH_EFFORT.test(name) ? 'high' : level
}

function openAILevel(name: string, level: Active, options: readonly ModelReasoningOption[]) {
  const offered = closestOffered(level, options)
  if (offered !== undefined) return offered
  return level === 'max' && !supportsMaxReasoningEffort(name) ? 'xhigh' : level
}

/** The model's provider and its name as that provider's rules read it (Anthropic's dashed). */
function nameOf(model: ModelId): { provider: string; name: string } {
  const { provider, modelId } = parseModelString(model)
  const name = provider === 'anthropic' ? modelId.replace(/\.(?=\d)/g, '-') : modelId
  return { provider: provider ?? '', name }
}

/**
 * The effort the model runs at when `effort` is asked: the same when it accepts it, another when
 * it reasons at a nearby one, `off` when it takes none.
 */
function runEffort(model: ModelId, effort: Effort): Effort {
  const { provider, name } = nameOf(model)
  if (effort === 'off' || !THINKING_PROVIDERS.has(provider)) return 'off'
  const options = getModelReasoningOptions(model)
  if (options === undefined || options.length === 0) return 'off'
  if (provider === 'anthropic') return anthropicLevel(name, effort, options)
  if (provider === 'openai') return openAILevel(name, effort, options)
  const family = geminiFamily(name)
  return family === undefined ? 'off' : geminiLevel(family, effort)
}

/** The efforts a model accepts, from Mastra's reasoning data (`getModelReasoningOptions`); `off` always. */
export function effortsOf(model: ModelId): Effort[] {
  return Effort.options.filter((effort) => runEffort(model, effort) === effort)
}

function googleOptions(name: string, level: Active): ProviderOptions | undefined {
  const family = geminiFamily(name)
  if (family === undefined) return undefined
  const gemini = geminiLevel(family, level)
  const thinkingConfig =
    family === 'budget'
      ? { thinkingBudget: GEMINI_25_BUDGETS[gemini] }
      : { thinkingLevel: family === 'minimal-high' && gemini === 'low' ? 'minimal' : gemini }
  return { google: { thinkingConfig } }
}

/** What one step asks the provider so the model reasons at `effort`; nothing for `off`. */
export function providerOptionsOf(model: ModelId, effort: Effort): ProviderOptions | undefined {
  const level = runEffort(model, effort)
  if (level === 'off') return undefined
  const { provider, name } = nameOf(model)
  switch (provider) {
    case 'anthropic':
      return anthropicCapability(name) === 'adaptive'
        ? { anthropic: { thinking: { type: 'adaptive', display: 'summarized' }, effort: level } }
        : {
            anthropic: {
              thinking: { type: 'enabled', budgetTokens: ANTHROPIC_BUDGET_TOKENS[level] },
            },
          }
    case 'google':
      return googleOptions(name, level)
    case 'openai':
      return { openai: { reasoningEffort: level } }
    default:
      return undefined
  }
}
