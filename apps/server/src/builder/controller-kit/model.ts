import type { ModelId } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { webFetchTool, webSearchTool } from '@mastra/core/tools'
import { Failure } from '../../platform/failure.ts'
import { chosenModel, providerOf } from '../model-accounts/public.ts'

// The providers whose native search Mastra resolves (`webSearchTool`); Google through CLIProxy
// stays out until the live proof of criterion 3 passes.
const SEARCH_PROVIDERS = new Set(['anthropic', 'openai', 'xai'])

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

/** `web_fetch` always; `web_search` only where Mastra resolves the provider's own search. */
export function toolsOf(modelId: ModelId): ToolsInput {
  const tools: ToolsInput = { web_fetch: webFetchTool }
  if (SEARCH_PROVIDERS.has(providerOf(modelId))) tools.web_search = webSearchTool
  return tools
}
