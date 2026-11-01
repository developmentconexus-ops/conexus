import type { Overview } from '@conexus/hub-api'
import { ASSISTANT_TOOL } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { SessionScope } from '../../hub/connectors/public.ts'

const NOT_FOUND = { kind: 'NOT_FOUND' } as const

/**
 * `conexus_overview` (Factory `factory_overview`, `supervisor/read-tools.ts:187`): the company's
 * Projetos with their app, and the connections the conversation's place offers, with whether it
 * chose each; read again on every call, never a key and never another company.
 */
export function overviewTool(deps: {
  scopeOf: (requestContext: RequestContext) => Promise<SessionScope | undefined>
  projectsOf: (scope: SessionScope) => Promise<Overview['projects']>
  connectionsOf: (requestContext: RequestContext) => Promise<Overview['connections']>
}) {
  return createTool({
    id: ASSISTANT_TOOL.overview,
    description:
      "The company in Conexus now: each Projeto with whether its app is published and the version people use, and each connection this conversation's place offers, with whether this conversation chose it.",
    inputSchema: z.object({}),
    execute: async (_input, { requestContext }) => {
      const scope = requestContext === undefined ? undefined : await deps.scopeOf(requestContext)
      if (requestContext === undefined || scope === undefined) return NOT_FOUND
      const [projects, connections] = await Promise.all([
        deps.projectsOf(scope),
        deps.connectionsOf(requestContext),
      ])
      return { projects, connections } satisfies Overview
    },
  })
}
