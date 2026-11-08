import type {
  AgentId,
  CompanyId,
  ConnectionId,
  OperationId,
  PersonId,
  Publish,
} from '@conexus/hub-api'
import {
  AgentConfig,
  AgentId as AgentIdSchema,
  CodeToolRead,
  ConnectionId as ConnectionIdSchema,
  ConnectorId as ConnectorIdSchema,
  OperationId as OperationIdSchema,
  ToolKind,
} from '@conexus/hub-api'
import { and, eq, max, sql } from 'drizzle-orm'
import type { KitRead } from '../../hub/connectors/public.ts'
import { operationLabel } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { InProject, OfferedConnection } from '../tools/public.ts'
import { versionsWithTools } from '../tools/public.ts'
import { legacyReads } from './legacy.ts'
import type { Choice } from './store.ts'
import { chosenIds, chosenOfDraft, ofProject, pinnedOf } from './store.ts'
import { agent, agentTool, agentVersion, agentVersionTool } from './tables.ts'

/** What publishing needs of the draft: instructions, and only connections the Projeto still offers. */
export async function invalidField(
  tx: ReadTx,
  draft: AgentConfig,
  agentId: AgentId,
  around: readonly OfferedConnection[],
) {
  if (draft.instructions.trim() === '') return 'instructions'
  const ids = new Set<string>(around.map((each) => each.connectionId))
  if (draft.connections.some((each) => !ids.has(each))) return 'connections'
  const tools = await versionsWithTools(tx, await chosenIds(tx, agentId))
  if (tools.some((each) => !ids.has(each.tool.connectionId))) return 'tools'
  return undefined
}

/** A read a chosen tool declares; `tool` names a company's own (code) tool by the title the person read, where one tool holds several reads. */
type Declared = { slug: string; connectionId: ConnectionId; operation: OperationId; tool?: string }

/** Each read the configuration will give the agent: its chosen tools', or for one written before E4 the kit's reads of its connections. */
async function declaredBy(
  tx: ReadTx,
  a: { config: AgentConfig; choices: readonly Choice[]; kit: readonly KitRead[] },
): Promise<Declared[]> {
  const rows = await versionsWithTools(
    tx,
    a.choices.map((each) => each.id),
  )
  const chosen = rows.flatMap((row): Declared[] => {
    const { slug, connectionId } = row.tool
    const home = ConnectionIdSchema.parse(connectionId)
    if (ToolKind.parse(row.tool.kind) === 'CODE') {
      const code = CodeToolRead.parse(row.version.config)
      return code.reads.map((operation) => ({
        ...{ slug, connectionId: home, operation: OperationIdSchema.parse(operation) },
        tool: code.description,
      }))
    }
    return [{ slug, connectionId: home, operation: OperationIdSchema.parse(row.tool.operation) }]
  })
  if (a.config.byTool) return chosen
  const kit = legacyReads(a.kit, a.config.connections).map((read) => ({
    slug: read.operation,
    connectionId: read.connectionId,
    operation: read.operation,
  }))
  return [...chosen, ...kit]
}

/** A configuration about to become the active version: the draft published, or a version brought back. */
type Becoming = {
  config: AgentConfig
  choices: readonly Choice[]
  around: readonly OfferedConnection[]
  kit: readonly KitRead[]
  identity: Pick<IdentityPorts, 'roleOf' | 'mayUseEach' | 'mayPublishUnattended'>
}

/**
 * Whether the role of who publishes holds every read the version will give the agent, the free
 * query included (decision C1 and E4): the first it lacks is `NOT_IN_ROLE` with the tool.
 */
async function refuseByRole(tx: ReadTx, scope: InProject, a: Becoming): Promise<void> {
  const declared = await declaredBy(tx, a)
  if (declared.length === 0) return
  const role = await a.identity.roleOf(tx, scope.companyId, scope.personId)
  const targets = declared.map((each) => ({
    connectionId: each.connectionId,
    connectorId: ConnectorIdSchema.parse(
      a.around.find((one) => one.connectionId === each.connectionId)?.connector,
    ),
    operationId: each.operation,
  }))
  const answers =
    role === undefined
      ? declared.map(() => false)
      : await a.identity.mayUseEach(
          scope.companyId,
          { kind: 'PERSON', personId: scope.personId, role },
          targets,
        )
  const at = declared.findIndex((_, index) => !answers[index])
  const refused = declared[at]
  const target = targets[at]
  if (refused !== undefined && target !== undefined) {
    throw new Failure('NOT_IN_ROLE', {
      details: { tool: refused.slug, operation: refused.operation },
      named: {
        field: 'tools',
        operation: refused.tool ?? operationLabel(target.connectorId, refused.operation),
      },
    })
  }
}

type Target = Parameters<IdentityPorts['mayUse']>[2]

/**
 * What a role check names of a tool's operation: its connection, the connector the place offers that
 * connection as, and the operation; none for a connection the place no longer offers.
 */
export function targetOf(
  offered: readonly Readonly<{ connectionId: ConnectionId; connector: string }>[],
  tool: Readonly<{ connectionId: ConnectionId; operation: string | null }>,
): Target | undefined {
  const home = offered.find((each) => each.connectionId === tool.connectionId)
  if (home === undefined) return undefined
  return {
    connectionId: tool.connectionId,
    connectorId: ConnectorIdSchema.parse(home.connector),
    operationId: OperationIdSchema.parse(tool.operation),
  }
}

/** The label a person reads for a target's operation. */
export function labelOf(target: Target): string {
  return operationLabel(target.connectorId, target.operationId)
}

/** The writes in Faz sozinho of the choices, each with its role check's target. */
async function alonesOf(
  tx: ReadTx,
  choices: readonly Choice[],
  around: readonly OfferedConnection[],
) {
  const rows = await versionsWithTools(
    tx,
    choices.filter((each) => each.approval === 'AUTO').map((each) => each.id),
  )
  return rows.flatMap(({ tool }) => {
    const target = targetOf(around, {
      ...tool,
      connectionId: ConnectionIdSchema.parse(tool.connectionId),
    })
    return target === undefined ? [] : [{ slug: tool.slug, ...target }]
  })
}

/**
 * Whether who saves or publishes may leave a write to run without asking (step 24.5, criterion 9):
 * the role read now, else `NOT_IN_ROLE` naming the write, and nothing is written.
 */
export async function mayLeaveAlone(
  identity: Pick<IdentityPorts, 'roleOf' | 'mayPublishUnattended'>,
  tx: ReadTx,
  scope: InProject,
  write: Target & { slug: string },
): Promise<void> {
  const role = await identity.roleOf(tx, scope.companyId, scope.personId)
  if (role !== undefined && (await identity.mayPublishUnattended(scope.companyId, role))) return
  throw new Failure('NOT_IN_ROLE', {
    details: { tool: write.slug, operation: write.operationId, reason: 'UNATTENDED_WRITE' },
    named: { field: 'tools', operation: labelOf(write) },
  })
}

/**
 * Whether who makes a configuration the active version may (step 24.5, option A of 2026-11-07):
 * publishing the draft and bringing back an older version pass the same checks, each read now.
 */
export async function refuseUnheld(tx: ReadTx, scope: InProject, a: Becoming): Promise<void> {
  await refuseByRole(tx, scope, a)
  const [alone] = await alonesOf(tx, a.choices, a.around)
  if (alone !== undefined) await mayLeaveAlone(a.identity, tx, scope, alone)
}

/** A published version as it would become active again: its configuration and its tools' versions. */
export async function versionBack(
  tx: ReadTx,
  agentId: AgentId,
  number: number,
): Promise<Pick<Becoming, 'config' | 'choices'> | undefined> {
  const [version] = await tx
    .select({ config: agentVersion.config })
    .from(agentVersion)
    .where(and(eq(agentVersion.agentId, agentId), eq(agentVersion.number, number)))
  if (version === undefined) return undefined
  return { config: AgentConfig.parse(version.config), choices: await pinnedOf(tx, agentId, number) }
}

export type Holding = {
  database: Database
  identity: Pick<IdentityPorts, 'roleOf' | 'mayUse' | 'mayPublishUnattended'>
}
/** The role a person holds in the company now; none once they left. */
function roleNow(deps: Holding, companyId: CompanyId, personId: PersonId) {
  return deps.database.read({ kind: 'COMPANY', companyId, personId: null }, (tx) =>
    deps.identity.roleOf(tx, companyId, personId),
  )
}

/** Whether a person's role, read now, holds a write: who approves its card (step 24.5, D3-a). */
export async function holdsWrite(
  deps: Holding,
  companyId: CompanyId,
  personId: PersonId,
  target: Target,
): Promise<boolean> {
  const role = await roleNow(deps, companyId, personId)
  if (role === undefined) return false
  return deps.identity.mayUse(companyId, { kind: 'PERSON', personId, role }, target)
}

/**
 * Whether a version's write in Faz sozinho still runs without asking (step 24.5, D2-a): who
 * answers for the version is still in the company, and their role, read now, holds both the action
 * and the write. Otherwise it asks; what the version declares does not change. The run answers for
 * the version by who made it active when the run began (`agent.active_by`, read with the version
 * in `activeOf`), so a later publish or restore does not change who answers for a run in progress.
 */
export async function answererLeavesAlone(
  deps: Holding,
  companyId: CompanyId,
  answeredBy: PersonId | null,
  target: Target,
): Promise<boolean> {
  // A person who left takes their authorship with them (`release.ts`), so no one leaves it alone.
  if (answeredBy === null) return false
  const role = await roleNow(deps, companyId, answeredBy)
  if (role === undefined || !(await deps.identity.mayPublishUnattended(companyId, role))) {
    return false
  }
  return holdsWrite(deps, companyId, answeredBy, target)
}

/** Makes the version the agent's active one, answered for by `by`; the draft does not change. */
export function makeActive(tx: CommandTx, agentId: AgentId, number: number, by: PersonId) {
  return tx
    .update(agent)
    .set({ activeVersion: number, activeBy: by, updatedAt: sql`now()` })
    .where(eq(agent.id, agentId))
}

/**
 * What a publish did: a new version, the version of the same revision made active again (after a
 * return to an older one), or nothing, that version being the active one already.
 */
type Published = { number: number; did: 'PUBLISHED' | 'ACTIVATED' | 'NONE' }

type AgentRow = typeof agent.$inferSelect

/**
 * The version the same revision made before, if any. It is made active again only while the draft
 * is still that revision, after a return to another version; once the draft moved on, a late
 * publish of the old revision returns the version and changes nothing.
 */
async function republished(
  tx: CommandTx,
  row: AgentRow,
  revision: number,
  by: PersonId,
  check: (number: number) => Promise<void>,
): Promise<Published | undefined> {
  const [earlier] = await tx
    .select({ number: agentVersion.number })
    .from(agentVersion)
    .where(and(eq(agentVersion.agentId, row.id), eq(agentVersion.sourceRevision, revision)))
  if (earlier === undefined) return undefined
  if (row.activeVersion === earlier.number || row.revision !== revision) {
    return { number: earlier.number, did: 'NONE' }
  }
  await check(earlier.number)
  await makeActive(tx, AgentIdSchema.parse(row.id), earlier.number, by)
  return { number: earlier.number, did: 'ACTIVATED' }
}

/** The draft as the next version, with the version of each tool it chose, made active. */
async function frozen(
  tx: CommandTx,
  scope: InProject,
  a: { agentId: AgentId; draft: AgentConfig; body: Publish },
): Promise<Published> {
  const { agentId, draft, body } = a
  const { companyId } = scope
  const [last] = await tx
    .select({ number: max(agentVersion.number) })
    .from(agentVersion)
    .where(eq(agentVersion.agentId, agentId))
  const number = (last?.number ?? 0) + 1
  await tx.insert(agentVersion).values({
    ...{ agentId, number, companyId, config: draft },
    ...{ sourceRevision: body.revision, message: body.message, publishedBy: scope.personId },
  })
  const chosen = await tx.select().from(agentTool).where(eq(agentTool.agentId, agentId))
  if (chosen.length > 0) {
    await tx.insert(agentVersionTool).values(
      chosen.map(({ toolVersionId, approval }) => ({
        ...{ agentId, number, toolVersionId, companyId, approval },
      })),
    )
  }
  await makeActive(tx, agentId, number, scope.personId)
  return { number, did: 'PUBLISHED' }
}

/**
 * Freezes the draft of the revision read as the next version, with the version of each chosen
 * tool, and makes it active. The agent's row is held first, which waits for a draft change in
 * flight; the same revision again finds the version it made (see `republished`).
 */
export async function published(
  tx: CommandTx,
  scope: InProject,
  a: {
    agentId: AgentId
    body: Publish
    around: readonly OfferedConnection[]
    kit: readonly KitRead[]
    identity: Pick<IdentityPorts, 'roleOf' | 'mayUseEach' | 'mayPublishUnattended'>
  },
): Promise<Published> {
  const { agentId, body } = a
  const [row] = await tx.select().from(agent).where(ofProject(scope, agentId)).for('update')
  if (row === undefined) throw new Failure('AGENT_NOT_FOUND')
  const earlier = await republished(tx, row, body.revision, scope.personId, async (number) => {
    const back = await versionBack(tx, agentId, number)
    if (back === undefined) throw new Failure('AGENT_VERSION_NOT_FOUND')
    await refuseUnheld(tx, scope, { ...a, ...back })
  })
  if (earlier !== undefined) return earlier
  if (row.revision !== body.revision) throw new Failure('AGENT_DRAFT_STALE')
  const draft = AgentConfig.parse(row.draft)
  const field = await invalidField(tx, draft, agentId, a.around)
  if (field !== undefined) throw new Failure('AGENT_DRAFT_INVALID', { named: { field } })
  await refuseUnheld(tx, scope, { ...a, config: draft, choices: await chosenOfDraft(tx, agentId) })
  return frozen(tx, scope, { agentId, draft, body })
}
