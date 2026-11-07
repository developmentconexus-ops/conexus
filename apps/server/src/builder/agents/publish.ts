import type { AgentId, ConnectionId, OperationId, Publish } from '@conexus/hub-api'
import {
  AgentConfig,
  AgentId as AgentIdSchema,
  CodeToolRead,
  ConnectionId as ConnectionIdSchema,
  ConnectorId as ConnectorIdSchema,
  OperationId as OperationIdSchema,
  ToolKind,
  ToolVersionId as ToolVersionIdSchema,
} from '@conexus/hub-api'
import { and, eq, max, sql } from 'drizzle-orm'
import type { KitRead } from '../../hub/connectors/public.ts'
import { operationLabel } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { InProject, OfferedConnection } from '../tools/public.ts'
import { versionsWithTools } from '../tools/public.ts'
import { legacyReads } from './legacy.ts'
import { chosenIds, ofProject } from './store.ts'
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

/** Each read the draft will give the agent: its chosen tools', or for a draft written before E4 the kit's reads of its connections. */
async function declaredBy(
  tx: ReadTx,
  a: { draft: AgentConfig; agentId: AgentId; kit: readonly KitRead[] },
): Promise<Declared[]> {
  const rows = await versionsWithTools(tx, await chosenIds(tx, a.agentId))
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
  if (a.draft.byTool) return chosen
  const kit = legacyReads(a.kit, a.draft.connections).map((read) => ({
    slug: read.operation,
    connectionId: read.connectionId,
    operation: read.operation,
  }))
  return [...chosen, ...kit]
}

/**
 * Whether the role of who publishes holds every read the version will give the agent, the free
 * query included (decision C1 and E4): the first it lacks is `NOT_IN_ROLE` with the tool.
 */
async function refuseByRole(
  tx: ReadTx,
  scope: InProject,
  a: {
    draft: AgentConfig
    agentId: AgentId
    around: readonly OfferedConnection[]
    kit: readonly KitRead[]
    identity: Pick<IdentityPorts, 'roleOf' | 'mayUseEach'>
  },
): Promise<void> {
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

/** The draft's writes in Faz sozinho, each with its connector and operation. */
async function alonesOf(tx: ReadTx, agentId: AgentId, around: readonly OfferedConnection[]) {
  const auto = await tx
    .select({ toolVersionId: agentTool.toolVersionId })
    .from(agentTool)
    .where(and(eq(agentTool.agentId, agentId), eq(agentTool.approval, 'AUTO')))
  const rows = await versionsWithTools(
    tx,
    auto.map((each) => ToolVersionIdSchema.parse(each.toolVersionId)),
  )
  return rows.flatMap(({ tool }) => {
    const home = around.find((each) => each.connectionId === tool.connectionId)
    if (home === undefined) return []
    const operation = OperationIdSchema.parse(tool.operation)
    return [{ slug: tool.slug, connector: home.connector, operation }]
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
  write: { slug: string; connector: string; operation: OperationId },
): Promise<void> {
  const role = await identity.roleOf(tx, scope.companyId, scope.personId)
  if (role !== undefined && (await identity.mayPublishUnattended(scope.companyId, role))) return
  throw new Failure('NOT_IN_ROLE', {
    details: { tool: write.slug, operation: write.operation, reason: 'UNATTENDED_WRITE' },
    named: {
      field: 'tools',
      operation: operationLabel(ConnectorIdSchema.parse(write.connector), write.operation),
    },
  })
}

/** Makes the version the agent's active one; the draft does not change. */
export function makeActive(tx: CommandTx, agentId: AgentId, number: number) {
  return tx
    .update(agent)
    .set({ activeVersion: number, updatedAt: sql`now()` })
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
): Promise<Published | undefined> {
  const [earlier] = await tx
    .select({ number: agentVersion.number })
    .from(agentVersion)
    .where(and(eq(agentVersion.agentId, row.id), eq(agentVersion.sourceRevision, revision)))
  if (earlier === undefined) return undefined
  if (row.activeVersion === earlier.number || row.revision !== revision) {
    return { number: earlier.number, did: 'NONE' }
  }
  await makeActive(tx, AgentIdSchema.parse(row.id), earlier.number)
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
  await makeActive(tx, agentId, number)
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
  const earlier = await republished(tx, row, body.revision)
  if (earlier !== undefined) return earlier
  if (row.revision !== body.revision) throw new Failure('AGENT_DRAFT_STALE')
  const draft = AgentConfig.parse(row.draft)
  const field = await invalidField(tx, draft, agentId, a.around)
  if (field !== undefined) throw new Failure('AGENT_DRAFT_INVALID', { named: { field } })
  await refuseByRole(tx, scope, { ...a, draft })
  const [alone] = await alonesOf(tx, agentId, a.around)
  if (alone !== undefined) await mayLeaveAlone(a.identity, tx, scope, alone)
  return frozen(tx, scope, { agentId, draft, body })
}
