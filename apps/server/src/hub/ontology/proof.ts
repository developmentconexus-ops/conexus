import { createHash, randomUUID } from 'node:crypto'
import type { CompanyId, ConnectionId } from '@conexus/hub-api'
import { ProofRunId, ProofShape } from '@conexus/hub-api'
import { and, desc, eq, inArray } from 'drizzle-orm'
import type { z } from 'zod'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { ProofAnswer } from '../connectors/public.ts'
import { proofRun } from './tables.ts'

export type Shape = z.infer<typeof ProofShape>
/** A proof the system answered, kept whether it proved or failed; a refusal of the role or the calls ran nothing. */
export type Proved = Readonly<{
  id: ProofRunId
  sql: string
  answer: Extract<ProofAnswer, { kind: 'OK' | 'FAILED' }>
  ranAt: Date
}>

function hashOf(query: string): string {
  return createHash('sha256').update(query).digest('hex')
}

/** A proof as it ran, before it is written: its id is the item's from now on. */
export function provedNow(sql: string, answer: Proved['answer']): Proved {
  return { id: ProofRunId.parse(randomUUID()), sql, answer, ranAt: new Date() }
}

/** The proofs written in the proposal's transaction (D22: they ran before it opened), each logged. */
export async function writeProofs(
  tx: CommandTx,
  log: FailureLog,
  on: Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>,
  proofs: readonly Proved[],
): Promise<void> {
  if (proofs.length === 0) return
  await tx.insert(proofRun).values(
    proofs.map(({ id, sql, answer, ranAt }) => ({
      ...{ id, companyId: on.companyId, connectionId: on.connectionId, query: sql },
      ...{ queryHash: hashOf(sql), ranAt },
      ...(answer.kind === 'OK'
        ? {
            outcome: 'OK' as const,
            reason: null,
            rows: answer.rows,
            shape: ProofShape.parse(answer.shape),
            outsideBase: answer.outsideBase ?? null,
          }
        : {
            outcome: 'FAILED' as const,
            reason: answer.reason,
            rows: 0,
            shape: [],
            outsideBase: null,
          }),
    })),
  )
  for (const { answer } of proofs)
    log.info(
      {
        connectionId: on.connectionId,
        outcome: answer.kind,
        rows: answer.kind === 'OK' ? answer.rows : 0,
      },
      'ONTOLOGY_PROOF_RAN',
    )
}

/** The shape each proof saw, by its id. */
export async function shapesOf(tx: ReadTx, ids: readonly string[]): Promise<Map<string, Shape>> {
  if (ids.length === 0) return new Map()
  const rows = await tx
    .select({ id: proofRun.id, shape: proofRun.shape })
    .from(proofRun)
    .where(and(inArray(proofRun.id, [...ids]), eq(proofRun.outcome, 'OK')))
  return new Map(rows.map((row) => [row.id, ProofShape.parse(row.shape)]))
}

/** The newest shape a query of a connection proved, the one its active source is read by now. */
export async function newestShapeOf(
  tx: ReadTx,
  on: Readonly<{ connectionId: ConnectionId; sql: string }>,
): Promise<Shape | undefined> {
  const [row] = await tx
    .select({ shape: proofRun.shape })
    .from(proofRun)
    .where(
      and(
        eq(proofRun.connectionId, on.connectionId),
        eq(proofRun.queryHash, hashOf(on.sql)),
        eq(proofRun.outcome, 'OK'),
      ),
    )
    .orderBy(desc(proofRun.ranAt))
    .limit(1)
  return row === undefined ? undefined : ProofShape.parse(row.shape)
}
