import type {
  Catalog,
  CatalogTable,
  CompanyData,
  ConnectionId,
  KeptSource,
  Overview,
} from '@conexus/hub-api'
import { ASSISTANT_TOOL } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { SessionScope } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { admitAsker } from '../controller-kit/public.ts'
import type { AssistantProjects } from './ports.ts'

/**
 * `conexus_overview` (Factory `factory_list_work_items`, `mastracode/factory/src/tools/read-tools.ts:245`,
 * `createFactoryReadTools`, Mastra 1.83): the company's Projetos with their app, and the connections
 * the conversation's place offers, with whether it chose each; read again on every call, never a key
 * and never another company.
 */
export function overviewTool(deps: {
  scopeOf: (requestContext: RequestContext) => Promise<SessionScope | undefined>
  projectsOf: (scope: SessionScope) => Promise<Omit<Overview, 'connections'>>
  connectionsOf: (
    requestContext: RequestContext,
    scope: SessionScope,
  ) => Promise<Overview['connections']>
}) {
  return createTool({
    id: ASSISTANT_TOOL.overview,
    description:
      "The company in Conexus now: its Projetos by name, at most 50, with whether its app is published and the version people use, and moreProjects true when it has more; and each connection this conversation's place offers that the person reaches (a table to read or an operation to use), with whether this conversation chose it.",
    inputSchema: z.object({}),
    execute: async (_input, { requestContext }) => {
      const scope = requestContext === undefined ? undefined : await deps.scopeOf(requestContext)
      // A tool runs inside a conversation's turn, as the instructions do: none is a fault of ours.
      if (requestContext === undefined || scope === undefined) {
        throw new Failure('INTERNAL_UNEXPECTED', {
          details: { reason: 'OVERVIEW_WITHOUT_CONVERSATION' },
        })
      }
      const [projects, connections] = await Promise.all([
        deps.projectsOf(scope),
        deps.connectionsOf(requestContext, scope),
      ])
      return { ...projects, connections } satisfies Overview
    },
  })
}

/**
 * The live Projetos of the company with their app, published or not, a page of them and whether
 * there are more.
 */
export function projectsOf(
  deps: { database: Database; identity: IdentityPorts; projects: AssistantProjects },
  scope: SessionScope,
): Promise<Omit<Overview, 'connections'>> {
  const { companyId, personId } = scope
  return deps.database.read({ kind: 'COMPANY', companyId, personId }, async (tx) => {
    await admitAsker(deps.identity, tx, scope)
    const live = await deps.projects.liveProjectsOf(tx, scope.companyId)
    const ids = live.projects.map((each) => each.projectId)
    const published = await deps.projects.publishedVersionsOf(tx, ids)
    const projects = live.projects.map((each) => {
      const version = published.get(each.projectId)
      const app =
        version === undefined
          ? ({ kind: 'NOT_PUBLISHED' } as const)
          : ({ kind: 'PUBLISHED', version: String(version) } as const)
      return { ...each, app }
    })
    return { projects, moreProjects: live.more }
  })
}

function namedBy(source: KeptSource): ConnectionId[] {
  return source.kind === 'NAMED' ? [source.connection.id] : []
}

function copiedFrom(table: CatalogTable): ConnectionId[] {
  return table.kept.sources.flatMap(namedBy)
}

/** The connections of a catalog the asker reaches: a system with an operation to use, or the source of a table to read. */
function reachedIn(catalog: Catalog): ReadonlySet<ConnectionId> {
  return new Set([
    ...catalog.systems.map((system) => system.connection),
    ...catalog.tables.flatMap(copiedFrom),
  ])
}

/** What the access door lists for the conversation's asker, as `data_describe` does. */
export function reachedBy(companyData: (scope: SessionScope) => CompanyData) {
  return async (scope: SessionScope): Promise<ReadonlySet<ConnectionId>> => {
    const described = await companyData(scope).describe()
    if (described.kind === 'CATALOG_UNAVAILABLE') throw new Failure('DATABASE_UNAVAILABLE')
    return reachedIn(described)
  }
}

/**
 * The connections a conversation's place offers that the asker reaches through the access door, as
 * the overview states them: the model never reads more of one than these four fields.
 */
export function connectionsOffered(
  offeredOf: (
    requestContext: RequestContext,
  ) => Promise<readonly Overview['connections'][number][]>,
  reachedOf: (scope: SessionScope) => Promise<ReadonlySet<ConnectionId>>,
) {
  return async (
    requestContext: RequestContext,
    scope: SessionScope,
  ): Promise<Overview['connections']> => {
    const [offered, reached] = await Promise.all([offeredOf(requestContext), reachedOf(scope)])
    return offered
      .filter(({ connectionId }) => reached.has(connectionId))
      .map(({ connectionId, connector, name, chosen }) => ({
        connectionId,
        connector,
        name,
        chosen,
      }))
  }
}
