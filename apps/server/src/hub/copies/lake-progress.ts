import type { CompanyId } from '@conexus/hub-api'
import { and, eq, isNull, lt, or } from 'drizzle-orm'
import type { CopyQueue } from '../../platform/aws.ts'
import type { Database } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { logFailure } from '../../platform/failure.ts'
import { companyScope } from './lake-close.ts'
import type { CopyTaskProgress } from './lake-task.ts'
import { lakeRun } from './tables.ts'

/**
 * The task's scoreboard, written without closing the round and taken off the queue: only a copy's
 * open round, of the same attempt, takes a `seq` above the one it holds, so a repeat or a late
 * delivery changes nothing. A database out loses the message: the next scoreboard carries every
 * table whole.
 */
export async function takeProgress(
  deps: { database: Database; queue: CopyQueue; log: FailureLog },
  round: Readonly<{ companyId: CompanyId; kind: 'COPY' | 'TREATMENT' }> | undefined,
  entry: CopyTaskProgress,
  handle: string,
): Promise<void> {
  if (round?.kind === 'COPY') await write(deps, round.companyId, entry)
  else deps.log.info({ runId: entry.runId, type: entry.type }, 'COPY_QUEUE_RUN_UNKNOWN')
  await deps.queue.acknowledge(handle)
}

async function write(
  { database, log }: { database: Database; log: FailureLog },
  companyId: CompanyId,
  entry: CopyTaskProgress,
) {
  try {
    await database.command(companyScope(companyId), (tx) =>
      tx
        .update(lakeRun)
        .set({ progress: entry, progressSeq: entry.seq })
        .where(
          and(
            eq(lakeRun.id, entry.runId),
            isNull(lakeRun.endedAt),
            eq(lakeRun.attempt, entry.attempt),
            or(isNull(lakeRun.progressSeq), lt(lakeRun.progressSeq, entry.seq)),
          ),
        ),
    )
  } catch (error) {
    logFailure(log, databaseFailure(error), { runId: entry.runId }, 'COPY_PROGRESS_NOT_WRITTEN')
  }
}
