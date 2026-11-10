import { randomUUID } from 'node:crypto'
import type { OfProject } from '@conexus/hub-api'
import { CopyProposalId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { z } from 'zod'
import { violatedConstraint, violatedReference } from '../../platform/database.ts'
import type { Proposal, ProposeAnswer } from '../connectors/public.ts'
import { CopyDefinition, CopyName, connectionNamesOf } from '../connectors/public.ts'
import { copyModeOf } from './mode.ts'
import type { CopiesDeps } from './store.ts'
import { companyScope } from './store.ts'
import { copy, copyProposal, projectCopy } from './tables.ts'

/** The schema's refusal as the model can act on it: each path with the schema's message, no value. */
function issuesOf(error: z.ZodError, prefix: string): string[] {
  return error.issues.map((issue) => `${[prefix, ...issue.path].join('.')}: ${issue.message}`)
}

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

/**
 * Propor (Capacidade 3, U3): the definition by `CopyDefinition` and the name by `CopyName`, the name
 * against the company's copies and open proposals, one page of proof through the connectors' port
 * (the count, never a row), then the row, which the partial unique index guards against a second
 * open proposal of the name. Nothing is written on any refusal.
 */
export async function propose(
  deps: CopiesDeps,
  ids: OfProject,
  a: Proposal,
): Promise<ProposeAnswer> {
  const parsedName = CopyName.safeParse(a.name)
  const parsed = CopyDefinition.safeParse(a.definition)
  const issues = [
    ...(parsedName.success ? [] : issuesOf(parsedName.error, 'name')),
    ...(parsed.success ? [] : issuesOf(parsed.error, 'definition')),
  ]
  if (!parsedName.success || !parsed.success) return { kind: 'MALFORMED', issues }
  const name = parsedName.data
  const definition = parsed.data
  const taken = await existing(deps, ids, name)
  if (taken !== undefined) return taken
  const { connectionId, personId, runId, signal } = a
  const proved = await deps.prove()(ids, { connectionId, personId, runId, definition, signal })
  if (proved.kind !== 'PROVED') return proved
  const id = CopyProposalId.parse(randomUUID())
  const scope = { kind: 'COMPANY', companyId: ids.companyId, personId } as const
  const linked = await deps.database.command(scope, async (tx) => {
    const named = await connectionNamesOf(tx, { companyId: ids.companyId, ids: [connectionId] })
    const connection = named.get(connectionId)
    if (connection === undefined) return undefined
    try {
      await tx.insert(copyProposal).values({
        ...{ id, companyId: ids.companyId, connectorId: connection.connector, connectionId },
        ...{ projectId: ids.projectId, name, label: a.label, definition },
        ...{ proposedBy: personId, provedRows: proved.rows, provedMore: proved.more },
        ...{ proposedAt: sql`statement_timestamp()`, state: 'OPEN' as const },
      })
    } catch (error) {
      if (violatedConstraint(error) === 'copy_proposal_open_name_key') return 'TAKEN' as const
      // The Projeto or the connection was deleted after the proof: the proposal has nowhere to live.
      if (violatedReference(error) !== undefined) return undefined
      throw error
    }
    return connection
  })
  if (linked === 'TAKEN') return { kind: 'EXISTS', name, releasedHere: false }
  if (linked === undefined) return { kind: 'NOT_GRANTED' }
  const { rows, more } = proved
  deps.log.info({ ...ids, proposalId: id, connectionId, rows, more }, 'COPY_PROPOSED')
  return {
    kind: 'PROPOSED',
    proposalId: id,
    name,
    connection: linked,
    key: definition.key,
    mode: copyModeOf(definition),
    rows,
    more,
  }
}
