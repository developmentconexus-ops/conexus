import type {
  AgentConfig,
  CodeToolRead,
  CompanyId,
  OfProject,
  ToolApproval,
  ToolSlug,
  ToolTarget,
  ToolVersionConfig,
  ToolVersionId,
} from '@conexus/hub-api'
import {
  AgentConfig as AgentConfigSchema,
  AgentId,
  CodeToolRead as CodeToolReadSchema,
  CompanyId as CompanyIdSchema,
  ConnectionId,
  OperationId,
  PersonId,
  ProjectId,
  ToolKind,
  ToolSlug as ToolSlugSchema,
  ToolVersionConfig as ToolVersionConfigSchema,
  ToolVersionId as ToolVersionIdSchema,
} from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { versionsWithTools } from '../tools/public.ts'
import type { Activation } from './activation.ts'
import type { Choice } from './store.ts'
import { choiceOf, chosenOfDraft, ofProject, pinnedOf, versionBack } from './store.ts'
import { agent, agentVersion, agentVersionTool } from './tables.ts'

/**
 * A `PRESET` tool as its version holds it: one read or one write, with the values it fixes; a write
 * with whether it asks first (step 24.5).
 */
export type PresetFrozenTool = ToolTarget &
  ToolVersionConfig & { kind: 'PRESET'; slug: ToolSlug; approval?: ToolApproval }

/**
 * A `CODE` tool as its version holds it: the reads it declares and the schemas of its input and
 * output, never its source or module (the agent runs the Worker the version was uploaded as).
 */
export type CodeFrozenTool = Pick<
  CodeToolRead,
  'description' | 'reads' | 'inputSchema' | 'outputSchema'
> & { kind: 'CODE'; slug: ToolSlug; toolVersionId: ToolVersionId; connectionId: ConnectionId }

export type FrozenTool = PresetFrozenTool | CodeFrozenTool

/** The configuration a version or the draft becomes an agent with, its tools as their versions hold them. */
export type FrozenVersion = AgentConfig & {
  tools: readonly FrozenTool[]
  source:
    | { kind: 'VERSION'; number: number; answeredBy: PersonId | null }
    | { kind: 'DRAFT'; revision: number }
}

// A row of `builder.companies_with_agents()`.
const WithAgents = z.object({ company_id: CompanyIdSchema })

function hubScope(companyId: CompanyId) {
  return { kind: 'COMPANY', companyId, personId: null } as const
}

type Tools = readonly FrozenTool[]

/** A tool as its version holds it, by its tool's kind (code C21). */
function frozenOf(
  row: Awaited<ReturnType<typeof versionsWithTools>>[number],
  approval: ToolApproval | undefined,
): FrozenTool {
  const { version, tool } = row
  const slug = ToolSlugSchema.parse(tool.slug)
  const connectionId = ConnectionId.parse(tool.connectionId)
  const kind = ToolKind.parse(tool.kind)
  switch (kind) {
    case 'CODE': {
      const { description, reads, inputSchema, outputSchema } = CodeToolReadSchema.parse(
        version.config,
      )
      const toolVersionId = ToolVersionIdSchema.parse(version.id)
      return {
        ...{ kind: 'CODE', slug, connectionId, toolVersionId },
        ...{ description, reads, inputSchema, outputSchema },
      }
    }
    case 'PRESET':
      return {
        kind,
        connectionId,
        operation: OperationId.parse(tool.operation),
        slug,
        ...ToolVersionConfigSchema.parse(version.config),
        ...(approval === undefined ? {} : { approval }),
      }
    default:
      return kind satisfies never
  }
}

/** The tools of the choices named, by version, as each version holds it. */
async function toolsBy(tx: ReadTx, choices: readonly Choice[]) {
  const rows = await versionsWithTools(
    tx,
    choices.map((each) => each.id),
  )
  return new Map(
    rows.map((row) => {
      const approval = choices.find((each) => each.id === row.version.id)?.approval
      return [row.version.id, frozenOf(row, approval)]
    }),
  )
}

function sorted(tools: FrozenTool[]): Tools {
  return tools.sort((a, b) => a.slug.localeCompare(b.slug))
}

async function toolsOf(tx: ReadTx, choices: readonly Choice[]): Promise<Tools> {
  return sorted([...(await toolsBy(tx, choices)).values()])
}

/** The active version of an agent of the Projeto, as it was published; none before the first. */
export function activeOf(database: Database, ids: OfProject, agentId: AgentId) {
  return database.read(hubScope(ids.companyId), async (tx): Promise<FrozenVersion | null> => {
    const [row] = await tx
      .select({
        config: agentVersion.config,
        number: agentVersion.number,
        answeredBy: agent.activeBy,
      })
      .from(agent)
      .innerJoin(
        agentVersion,
        and(eq(agentVersion.agentId, agent.id), eq(agentVersion.number, agent.activeVersion)),
      )
      .where(ofProject(ids, agentId))
    if (row === undefined) return null
    const tools = await toolsOf(tx, await pinnedOf(tx, agentId, row.number))
    const source = {
      kind: 'VERSION',
      number: row.number,
      answeredBy: PersonId.nullable().parse(row.answeredBy),
    } as const
    return { ...AgentConfigSchema.parse(row.config), tools, source }
  })
}

/**
 * A published version as it was published, answered for by `answeredBy`: the version a turn that
 * began on it goes on with, once another has become the active one. None when the version is gone.
 */
export function versionOf(
  database: Database,
  ids: OfProject,
  agentId: AgentId,
  version: Activation,
) {
  return database.read(hubScope(ids.companyId), async (tx): Promise<FrozenVersion | null> => {
    const [row] = await tx.select({ id: agent.id }).from(agent).where(ofProject(ids, agentId))
    if (row === undefined) return null
    const back = await versionBack(tx, agentId, version.number)
    if (back === undefined) return null
    const source = { kind: 'VERSION', ...version } as const
    return { ...back.config, tools: await toolsOf(tx, back.choices), source }
  })
}

/** The draft of an agent of the Projeto, as it is now, for its test conversation. */
export function draftOf(database: Database, ids: OfProject, agentId: AgentId) {
  return database.read(hubScope(ids.companyId), async (tx): Promise<FrozenVersion> => {
    const [row] = await tx.select().from(agent).where(ofProject(ids, agentId))
    if (row === undefined) throw new Failure('AGENT_NOT_FOUND')
    const tools = await toolsOf(tx, await chosenOfDraft(tx, agentId))
    const source = { kind: 'DRAFT', revision: row.revision } as const
    return { ...AgentConfigSchema.parse(row.draft), tools, source }
  })
}

/** The active version of an agent of the company, wherever its Projeto is; none when gone or never published. */
export async function liveOf(database: Database, companyId: CompanyId, agentId: AgentId) {
  const [row] = await database.read(hubScope(companyId), (tx) =>
    tx
      .select({ projectId: agent.projectId })
      .from(agent)
      .where(and(eq(agent.companyId, companyId), eq(agent.id, agentId))),
  )
  if (row === undefined) return null
  const ids = { companyId, projectId: ProjectId.parse(row.projectId) }
  const version = await activeOf(database, ids, agentId)
  return version === null ? null : { ...version, ...ids, agentId }
}

/** Every published agent of one company, in three reads: the active versions, their pins, the tools. */
async function publishedOf(tx: ReadTx, companyId: CompanyId) {
  const active = and(
    eq(agentVersion.agentId, agent.id),
    eq(agentVersion.number, agent.activeVersion),
  )
  const rows = await tx
    .select({
      id: agent.id,
      projectId: agent.projectId,
      config: agentVersion.config,
      number: agentVersion.number,
      answeredBy: agent.activeBy,
    })
    .from(agent)
    .innerJoin(agentVersion, active)
    .where(eq(agent.companyId, companyId))
  const pins = await tx
    .select({
      agentId: agentVersionTool.agentId,
      id: agentVersionTool.toolVersionId,
      approval: agentVersionTool.approval,
    })
    .from(agentVersionTool)
    .innerJoin(agent, eq(agent.id, agentVersionTool.agentId))
    .where(and(eq(agent.companyId, companyId), eq(agentVersionTool.number, agent.activeVersion)))
  const tools = await toolsBy(tx, pins.map(choiceOf))
  return rows.map((row) => {
    const own = pins
      .filter((pin) => pin.agentId === row.id)
      .flatMap((pin) => tools.get(pin.id) ?? [])
    const ids = { companyId, projectId: ProjectId.parse(row.projectId) }
    return {
      ...AgentConfigSchema.parse(row.config),
      tools: sorted(own),
      source: {
        kind: 'VERSION',
        number: row.number,
        answeredBy: PersonId.nullable().parse(row.answeredBy),
      } as const,
      ...ids,
      agentId: AgentId.parse(row.id),
    }
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
    const { company_id: companyId } = WithAgents.parse(found)
    all.push(...(await database.read(hubScope(companyId), (tx) => publishedOf(tx, companyId))))
  }
  return all
}
