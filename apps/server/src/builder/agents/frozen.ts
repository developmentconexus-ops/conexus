import type {
  AgentConfig,
  CompanyId,
  OfProject,
  ToolSlug,
  ToolTarget,
  ToolVersionConfig,
} from '@conexus/hub-api'
import {
  AgentConfig as AgentConfigSchema,
  AgentId,
  CompanyId as CompanyIdSchema,
  ConnectionId,
  OperationId,
  ProjectId,
  ToolSlug as ToolSlugSchema,
  ToolVersionConfig as ToolVersionConfigSchema,
} from '@conexus/hub-api'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import type { Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { versionsWithTools } from '../tools/public.ts'
import { chosenIds, pinnedIds } from './store.ts'
import { agent, agentVersion } from './tables.ts'

/** The configuration a version or the draft becomes an agent with, its tools as their versions hold them. */
export type FrozenVersion = AgentConfig & {
  tools: readonly (ToolTarget & ToolVersionConfig & { slug: ToolSlug })[]
  source: { kind: 'VERSION'; number: number } | { kind: 'DRAFT'; revision: number }
}

function hubScope(companyId: CompanyId) {
  return { kind: 'COMPANY', companyId, personId: null } as const
}

async function toolsOf(tx: ReadTx, versionIds: readonly string[]): Promise<FrozenVersion['tools']> {
  const rows = await versionsWithTools(tx, versionIds)
  return rows
    .map(({ version, tool }) => ({
      connectionId: ConnectionId.parse(tool.connectionId),
      operation: OperationId.parse(tool.operation),
      slug: ToolSlugSchema.parse(tool.slug),
      ...ToolVersionConfigSchema.parse(version.config),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

function ofProject(ids: OfProject, agentId: AgentId) {
  return and(
    eq(agent.id, agentId),
    eq(agent.companyId, ids.companyId),
    eq(agent.projectId, ids.projectId),
  )
}

/** The active version of an agent of the Projeto, as it was published; none before the first. */
export function activeOf(database: Database, ids: OfProject, agentId: AgentId) {
  return database.read(hubScope(ids.companyId), async (tx): Promise<FrozenVersion | null> => {
    const [row] = await tx
      .select({ config: agentVersion.config, number: agentVersion.number })
      .from(agent)
      .innerJoin(
        agentVersion,
        and(eq(agentVersion.agentId, agent.id), eq(agentVersion.number, agent.activeVersion)),
      )
      .where(ofProject(ids, agentId))
    if (row === undefined) return null
    const tools = await toolsOf(tx, await pinnedIds(tx, agentId, row.number))
    const source = { kind: 'VERSION', number: row.number } as const
    return { ...AgentConfigSchema.parse(row.config), tools, source }
  })
}

/** The draft of an agent of the Projeto, as it is now, for its test conversation. */
export function draftOf(database: Database, ids: OfProject, agentId: AgentId) {
  return database.read(hubScope(ids.companyId), async (tx): Promise<FrozenVersion> => {
    const [row] = await tx.select().from(agent).where(ofProject(ids, agentId))
    if (row === undefined) throw new Failure('AGENT_NOT_FOUND')
    const tools = await toolsOf(tx, await chosenIds(tx, agentId))
    const source = { kind: 'DRAFT', revision: row.revision } as const
    return { ...AgentConfigSchema.parse(row.draft), tools, source }
  })
}

/**
 * Every published agent of every company, as each active version holds it: the companies come
 * from the one function the Hub's login runs before any company is known (D11), then each
 * company's rows under its own scope.
 */
export async function publishedAll(database: Database) {
  const companies = await database.installationRead((tx) =>
    tx.execute(sql`select company_id from builder.companies_with_agents()`),
  )
  const all: (FrozenVersion & OfProject & { agentId: AgentId })[] = []
  for (const found of companies.rows) {
    const companyId = CompanyIdSchema.parse(Object(found).company_id)
    const rows = await database.read(hubScope(companyId), (tx) =>
      tx
        .select({ id: agent.id, projectId: agent.projectId })
        .from(agent)
        .where(and(eq(agent.companyId, companyId), isNotNull(agent.activeVersion))),
    )
    for (const row of rows) {
      const ids = { companyId, projectId: ProjectId.parse(row.projectId) }
      const agentId = AgentId.parse(row.id)
      const version = await activeOf(database, ids, agentId)
      if (version !== null) all.push({ ...version, ...ids, agentId })
    }
  }
  return all
}
