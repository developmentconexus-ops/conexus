import { randomUUID } from 'node:crypto'
import type { ConnectionId, ConnectorId, OfProject, ProveCounts } from '@conexus/hub-api'
import { CopyProposalId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { violatedConstraint, violatedReference } from '../../platform/database.ts'
import type { Proposal, ProposeAnswer } from '../connectors/public.ts'
import {
  CopyDefinition,
  CopyName,
  connectionNamesOf,
  lackedSourceReadOf,
} from '../connectors/public.ts'
import { copyModeOf } from './mode.ts'
import type { CopiesDeps } from './store.ts'
import { companyScope, originOf } from './store.ts'
import { copy, copyProposal, copyProposalSource, projectCopy } from './tables.ts'

/** The schema's refusal as the model can act on it: each path with the schema's message, no value. */
function issuesOf(error: z.ZodError, prefix: string): string[] {
  return error.issues.map((issue) => `${[prefix, ...issue.path].join('.')}: ${issue.message}`)
}

const Connections = z
  .array(z.string())
  .min(1)
  .refine((list) => new Set(list).size === list.length, 'A connection is named once.')

/** A copy of the company or an open proposal that has the name; a copy says whether this Projeto has it released. */
async function existing(deps: CopiesDeps, ids: OfProject, name: CopyName) {
  return deps.database.read(companyScope(ids.companyId), async (tx) => {
    const [copied] = await tx
      .select({ id: copy.id, released: sql<boolean>`${projectCopy.copyId} IS NOT NULL` })
      .from(copy)
      .leftJoin(
        projectCopy,
        and(eq(projectCopy.copyId, copy.id), eq(projectCopy.projectId, ids.projectId)),
      )
      .where(and(eq(copy.companyId, ids.companyId), eq(copy.name, name)))
    if (copied !== undefined)
      return { kind: 'EXISTS', name, releasedHere: copied.released } as const
    const [open] = await tx
      .select({ id: copyProposal.id })
      .from(copyProposal)
      .where(
        and(
          eq(copyProposal.companyId, ids.companyId),
          eq(copyProposal.name, name),
          eq(copyProposal.state, 'OPEN'),
        ),
      )
    return open === undefined ? undefined : ({ kind: 'EXISTS', name, releasedHere: false } as const)
  })
}

type Named = Readonly<{ id: ConnectionId; name: string; connector: ConnectorId }>
type Sourced =
  | Readonly<{ kind: 'SOURCES'; connector: ConnectorId; sources: readonly Named[] }>
  | Extract<ProposeAnswer, { kind: 'MALFORMED' | 'NOT_GRANTED' | 'NOT_IN_ROLE' }>

/** A version 2 definition against the connector's list read, and several connections only on a connector with an account. */
function listIssuesOf(
  deps: CopiesDeps,
  a: {
    connector: ConnectorId
    definition: Extract<CopyDefinition, { version: 2 }>
    connections: number
  },
): string[] {
  const checked = deps.connectors().proposable(a.connector, a.definition)
  if (!checked.accountless || a.connections === 1) return [...checked.issues]
  const apart = `connections: ${a.connector} has no account to tell connections apart; name one.`
  return [...checked.issues, apart]
}

/**
 * The proposal's connections as the company has them, all of one connector; a version 2 definition
 * against that connector's list read, several connections only on a connector with an account, and
 * the role of who proposes using the read on each (one `mayUseEach` entry per connection).
 */
async function sourcesOf(
  deps: CopiesDeps,
  ids: OfProject,
  a: Proposal & { definition: CopyDefinition },
): Promise<Sourced> {
  const scope = { kind: 'COMPANY', companyId: ids.companyId, personId: a.personId } as const
  return deps.database.read(scope, async (tx) => {
    const names = await connectionNamesOf(tx, { companyId: ids.companyId, ids: a.connections })
    const sources = a.connections.flatMap((id) => {
      const found = names.get(id)
      return found === undefined ? [] : [{ id, ...found }]
    })
    const [first] = sources
    if (first === undefined || sources.length < a.connections.length) return { kind: 'NOT_GRANTED' }
    const { connector } = first
    if (sources.some((each) => each.connector !== connector))
      return { kind: 'MALFORMED', issues: ['connections: every connection is of one connector.'] }
    const { definition } = a
    if (definition.version === 1) {
      if (sources.length === 1) return { kind: 'SOURCES', connector, sources }
      return { kind: 'MALFORMED', issues: ['connections: a copy of a query reads one connection.'] }
    }
    const issues = listIssuesOf(deps, { connector, definition, connections: sources.length })
    if (issues.length > 0) return { kind: 'MALFORMED', issues }
    const lacked = await lackedSourceReadOf(deps, tx, {
      ...{ companyId: ids.companyId, personId: a.personId, connectorId: connector },
      ...{ operation: definition.source.operation, connections: a.connections },
    })
    return lacked ?? { kind: 'SOURCES', connector, sources }
  })
}

type Proofs =
  | Readonly<{ kind: 'PROVED'; rows: number; more: boolean; counts: ProveCounts[] }>
  | Exclude<ProposeAnswer, { kind: 'PROPOSED' | 'EXISTS' | 'MALFORMED' }>

/**
 * The proof of each connection in turn, through the connectors' port: the first refusal stops the
 * rest and comes back whole (C79). A key cell null or repeated, or a cell that does not fit its type,
 * refuses with the connection's name and the counts alone.
 */
async function proofs(
  deps: CopiesDeps,
  ids: OfProject,
  a: Proposal & { definition: CopyDefinition; sources: readonly Named[] },
): Promise<Proofs> {
  const counts: ProveCounts[] = []
  let rows = 0
  let more = false
  for (const source of a.sources) {
    const proved = await deps.prove()(ids, {
      ...{ connectionId: source.id, personId: a.personId, runId: a.runId },
      ...{ definition: a.definition, signal: a.signal },
    })
    if (proved.kind === 'MISFIT') return { ...proved, kind: 'TYPE_MISFIT', connection: source.name }
    if (proved.kind !== 'PROVED') return proved
    const { counts: of } = proved
    if (of !== null && (of.keyNull > 0 || of.keyRepeated > 0)) {
      const { keyNull, keyRepeated } = of
      return { kind: 'KEY_NOT_UNIQUE', connection: source.name, keyNull, keyRepeated }
    }
    if (of !== null) counts.push(of)
    // The proposal keeps one page's count: the most a connection's page brought, and whether any had more.
    rows = Math.max(rows, proved.rows)
    more ||= proved.more
  }
  return { kind: 'PROVED', rows, more, counts }
}

/** The calls a whole pass spends over every connection; null when a read does not tell its total, or the copy is a query's. */
function callsOf(definition: CopyDefinition, counts: readonly ProveCounts[]): number | null {
  if (definition.version === 1) return null
  let sum = 0
  for (const each of counts) {
    if (each.callsPerPass === null) return null
    sum += each.callsPerPass
  }
  return sum
}

const RawSource = z.object({
  version: z.literal(2),
  source: z.object({
    operation: z.string(),
    input: z.record(z.string(), z.unknown()).default({}),
  }),
})

/**
 * What a version 2 definition that fails the shape still fails against its connector's read, when
 * its operation and fixed input can be read: the refusal then names every issue at once, not one
 * layer a round. Nothing when the connections are not one connector the company has.
 */
async function readIssuesOf(deps: CopiesDeps, ids: OfProject, a: Proposal): Promise<string[]> {
  const raw = RawSource.safeParse(a.definition)
  if (!raw.success) return []
  const scope = { kind: 'COMPANY', companyId: ids.companyId, personId: a.personId } as const
  const connectors = await deps.database.read(scope, async (tx) => {
    const names = await connectionNamesOf(tx, { companyId: ids.companyId, ids: a.connections })
    return new Set(a.connections.flatMap((id) => names.get(id)?.connector ?? []))
  })
  const [connector, ...others] = connectors
  if (connector === undefined || others.length > 0) return []
  return deps.connectors().sourceIssues(connector, raw.data.source)
}

/**
 * Propor (Capacidade 3, U3; O Sync de qualquer conector, U4): the definition by `CopyDefinition` and
 * the name by `CopyName`, the name against the company's copies and open proposals, the connections
 * and the definition against the read, the proof of each connection (counts, never a row), then the
 * row and its sources in one transaction, which the partial unique index guards against a second open
 * proposal of the name. Nothing is written on any refusal.
 */
export async function propose(
  deps: CopiesDeps,
  ids: OfProject,
  a: Proposal,
): Promise<ProposeAnswer> {
  const parsedName = CopyName.safeParse(a.name)
  const parsed = CopyDefinition.safeParse(a.definition)
  const named = Connections.safeParse(a.connections)
  if (!parsedName.success || !parsed.success || !named.success) {
    const read = parsed.success || !named.success ? [] : await readIssuesOf(deps, ids, a)
    return {
      kind: 'MALFORMED',
      issues: [
        ...(parsedName.success ? [] : issuesOf(parsedName.error, 'name')),
        ...(parsed.success ? [] : issuesOf(parsed.error, 'definition')),
        ...(named.success ? [] : issuesOf(named.error, 'connections')),
        ...read,
      ],
    }
  }
  const name = parsedName.data
  const definition = parsed.data
  const taken = await existing(deps, ids, name)
  if (taken !== undefined) return taken
  const sourced = await sourcesOf(deps, ids, { ...a, definition })
  if (sourced.kind !== 'SOURCES') return sourced
  const { sources, connector } = sourced
  const proved = await proofs(deps, ids, { ...a, definition, sources })
  if (proved.kind !== 'PROVED') return proved
  const { rows, more, counts } = proved
  const calls = callsOf(definition, counts)
  const id = CopyProposalId.parse(randomUUID())
  const [first] = sources
  if (first === undefined) return { kind: 'NOT_GRANTED' }
  const scope = { kind: 'COMPANY', companyId: ids.companyId, personId: a.personId } as const
  const saved = await deps.database.command(scope, async (tx) => {
    try {
      await tx.insert(copyProposal).values({
        ...{ id, companyId: ids.companyId, connectorId: connector, connectionId: first.id },
        ...{ projectId: ids.projectId, name, label: a.label, definition },
        ...{ proposedBy: a.personId, provedRows: rows, provedMore: more, provedCalls: calls },
        ...{ proposedAt: sql`statement_timestamp()`, state: 'OPEN' as const },
      })
      await tx.insert(copyProposalSource).values(
        sources.map((source) => ({
          ...{ companyId: ids.companyId, proposalId: id },
          ...{ connectorId: connector, connectionId: source.id },
        })),
      )
    } catch (error) {
      if (violatedConstraint(error) === 'copy_proposal_open_name_key') return 'TAKEN' as const
      // The Projeto or a connection was deleted after the proof: the proposal has nowhere to live.
      if (violatedReference(error) !== undefined) return 'GONE' as const
      throw error
    }
    return 'SAVED' as const
  })
  if (saved === 'TAKEN') return { kind: 'EXISTS', name, releasedHere: false }
  if (saved === 'GONE') return { kind: 'NOT_GRANTED' }
  const connectionIds = sources.map((source) => source.id).join(',')
  const logged = { ...ids, proposalId: id, connectionIds, rows, more }
  deps.log.info(calls === null ? logged : { ...logged, calls }, 'COPY_PROPOSED')
  return {
    ...{ kind: 'PROPOSED', proposalId: id, name, source: originOf(connector, definition) },
    sources: sources.map((source) => ({ name: source.name, connector })),
    ...{ key: definition.key, mode: copyModeOf(definition), rows, more, calls, counts },
  }
}
