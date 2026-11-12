import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import type { ModelId } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { webFetchTool, webSearchTool } from '@mastra/core/tools'
import { Failure } from '../../platform/failure.ts'
import { chosenModel, providerOf } from '../model-accounts/public.ts'

// The providers whose native search Mastra resolves (`webSearchTool`) for xAI; Google through
// CLIProxy stays out until the paid proof of criterion 8 passes.
const MASTRA_SEARCH_PROVIDERS = new Set(['xai'])

/** Where the company is, which the provider's search ranks by (card of the alignment, U2). */
export const BR_LOCATION = {
  type: 'approximate',
  country: 'BR',
  timezone: 'America/Sao_Paulo',
} as const

function isRouterId(modelId: ModelId): modelId is ModelId & `${string}/${string}` {
  return modelId.includes('/')
}

/** The conversation's model, as its controller session holds it (`session.model.switch`). */
export function sessionModel(requestContext: RequestContext): ModelId & `${string}/${string}` {
  return routedModel(chosenModel(requestContext))
}

/** A model as Mastra's router names it, `provider/model`; any other is the Hub's defect. */
export function routedModel(modelId: ModelId): ModelId & `${string}/${string}` {
  if (!isRouterId(modelId)) {
    throw new Failure('INTERNAL_UNEXPECTED', {
      details: { reason: 'CONVERSATION_MODEL_NOT_ROUTED' },
    })
  }
  return modelId
}

/**
 * A tool the provider runs. The AI SDK types it without the `id` Mastra's input asks for, though
 * the factory sets it; a tool without one is the library's defect.
 */
function providerTool(tool: { type?: string }): ToolsInput[string] {
  if ('id' in tool && typeof tool.id === 'string') return { ...tool, id: tool.id }
  throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'PROVIDER_TOOL_WITHOUT_ID' } })
}

/**
 * The web as the model's provider does it: Anthropic's and OpenAI's own search with the company's
 * location, Anthropic's own page fetch with citations (a PDF is read, not its bytes); xAI's search
 * as Mastra resolves it; any other provider's page fetch is Mastra's `web_fetch`.
 */
export function toolsOf(modelId: ModelId): ToolsInput {
  switch (providerOf(modelId)) {
    case 'anthropic':
      return {
        web_search: providerTool(anthropic.tools.webSearch_20250305({ userLocation: BR_LOCATION })),
        web_fetch: providerTool(
          anthropic.tools.webFetch_20250910({ citations: { enabled: true } }),
        ),
      }
    case 'openai':
      return {
        web_search: providerTool(openai.tools.webSearch({ userLocation: BR_LOCATION })),
        web_fetch: webFetchTool,
      }
    default:
      return MASTRA_SEARCH_PROVIDERS.has(providerOf(modelId))
        ? { web_search: webSearchTool, web_fetch: webFetchTool }
        : { web_fetch: webFetchTool }
  }
}
