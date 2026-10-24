// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From mastra-ai/mastra at @mastra/core@1.78.0, mastracode/sdk/src/providers/claude-max.ts
// (`createPromptCacheMiddleware`) and anthropic-prompt-cache.ts. Changed: TypeScript without `any`;
// named `promptCacheMiddleware`.

import type { LanguageModelMiddleware } from 'ai'

type Transform = NonNullable<LanguageModelMiddleware['transformParams']>
type Message = Parameters<Transform>[0]['params']['prompt'][number]

/** A part that can carry a provider's options. */
type Marked = { providerOptions?: Message['providerOptions'] }

/** The agent's breakpoints' TTL; `activateAfterIdle` names the same for Anthropic (`builder.ts`). */
const PROMPT_CACHE_TTL = '1h'

/**
 * `conversation`: the last system message and the latest message, 1 h, for the agent's steps.
 * `system`: the last system message only, 5 min, for the title, the observer and the reflector,
 * whose content changes every call.
 */
export type PromptCacheScope = 'conversation' | 'system'
const PROMPT_CACHE_SCOPES = [
  'conversation',
  'system',
] as const satisfies readonly PromptCacheScope[]

export function promptCacheMiddleware(scope: PromptCacheScope): LanguageModelMiddleware {
  const cacheControl = {
    type: 'ephemeral',
    ttl: scope === 'conversation' ? PROMPT_CACHE_TTL : '5m',
  } as const
  function marked(message: Message): Message {
    switch (message.role) {
      case 'system': {
        const anthropic = { ...message.providerOptions?.anthropic, cacheControl }
        return { ...message, providerOptions: { ...message.providerOptions, anthropic } }
      }
      case 'user':
        return { ...message, content: lastMarked(message.content) }
      case 'assistant':
        return { ...message, content: lastMarked(message.content) }
      case 'tool':
        return { ...message, content: lastMarked(message.content) }
    }
  }
  function lastMarked<Part extends Marked>(parts: Part[]): Part[] {
    const last = parts.at(-1)
    if (last === undefined) return parts
    const anthropic = { ...last.providerOptions?.anthropic, cacheControl }
    return [
      ...parts.slice(0, -1),
      { ...last, providerOptions: { ...last.providerOptions, anthropic } },
    ]
  }
  return {
    specificationVersion: 'v3',
    transformParams: async ({ params }) => {
      const system = params.prompt.findLastIndex((message) => message.role === 'system')
      const latest = scope === 'conversation' ? params.prompt.length - 1 : -1
      const prompt = params.prompt.map((message, index) =>
        index === system || index === latest ? marked(message) : message,
      )
      return { ...params, prompt }
    },
  }
}
