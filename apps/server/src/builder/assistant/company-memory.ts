import type { KnowledgeScopeDeclarations } from '@mastra/core/knowledge'
import { Knowledge } from '@mastra/core/knowledge'
import type { RequestContext } from '@mastra/core/request-context'
import type { PostgresStore } from '@mastra/pg'
import type { ScopeOf } from './context.ts'
import type { Mays } from './instructions.ts'

/** Its tools, by the ids Mastra gives them: reading, writing and pinning the company's pages. */
export const COMPANY_MEMORY_TOOLS = [
  'knowledge_search',
  'knowledge_read',
  'knowledge_list',
  'knowledge_page',
  'knowledge_note',
  'knowledge_pin',
] as const

/** The page every company holds from its first conversation, pinned into each of them. */
const INSTRUCTIONS = { key: 'instrucoes', name: 'Instruções da empresa' } as const

/**
 * Who reads and writes what (Mastra Code `sdk/src/index.ts:865-888`): a run reads its own thread and
 * resource and its company's scope; only a run that also holds `writer:` edits the company's, as
 * only an owner or an administrator writes what holds for the whole company. Mastra's own
 * `knowledgeMemoryScopes` makes every run an editor of its tenant, which the roles do not allow.
 */
const SCOPES = {
  'thread:$threadId': { access: [{ principal: 'self', role: 'viewer' }] },
  'resource:$resourceId': { access: [{ principal: 'self', role: 'viewer' }] },
  'writer:$orgId': {},
  'org:$orgId': {
    access: [
      { principal: 'self', role: 'viewer' },
      { principal: 'writer:$orgId', role: 'editor' },
    ],
    pages: [INSTRUCTIONS],
    pinnedContext: [`org:$orgId#${INSTRUCTIONS.key}`],
  },
} satisfies KnowledgeScopeDeclarations

/**
 * The company's memory (alignment of the Assistant, U9): Mastra's `Knowledge` in Mastra's own store,
 * the one file of Conexus that speaks to it, as the API is experimental.
 */
export function companyKnowledge(storage: PostgresStore) {
  return new Knowledge({
    id: 'conexus-company',
    storage,
    scopes: SCOPES,
    tools: { read: true, write: true },
    pinnedContext: { maxTokens: 1000 },
  })
}

/**
 * The run's scopes: the incoming ones, which hold its thread and resource, then its company and, for
 * who may save the company's memory, its writer. Outside a conversation, no company: the run reads
 * only what is its own (fail closed, as Mastra Code's `knowledge-scope.ts:35`).
 */
export function companyScopes(deps: {
  scopeOf: ScopeOf
  maysOf: (requestContext: RequestContext) => Promise<Mays>
}) {
  return async ({
    scopes,
    requestContext,
  }: {
    scopes: string[]
    requestContext: RequestContext
  }) => {
    const scope = await deps.scopeOf(requestContext)
    if (scope === undefined) return scopes
    const { companyMemory } = await deps.maysOf(requestContext)
    const company = `org:${scope.companyId}`
    return [...scopes, company, ...(companyMemory ? [`writer:${scope.companyId}`] : [])]
  }
}
