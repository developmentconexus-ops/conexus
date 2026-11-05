import { randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import type { NoticeRequests } from '../requests/public.ts'
import { NOTICE_VIEW, request } from '../requests/public.ts'
import { microsOf, requestNotice } from './tables.ts'

/**
 * Writes what a request tells, once per request, person and kind: the asker writes the deciders'
 * rows, which they cannot read back, so nothing is returned.
 */
export const noticeRequests: NoticeRequests = async (tx, notices) => {
  if (notices.length === 0) return
  await tx
    .insert(requestNotice)
    .values(
      notices.map((notice) => ({
        id: randomUUID(),
        ...notice,
        createdAt: sql`statement_timestamp()`,
      })),
    )
    .onConflictDoNothing()
}

/** The bell's columns of a person's request notices, each with what its request says now. */
export function requestNoticeRows(tx: ReadTx) {
  return tx
    .select({
      id: requestNotice.id,
      kind: requestNotice.kind,
      createdAt: requestNotice.createdAt,
      micros: microsOf(requestNotice.createdAt),
      readAt: requestNotice.readAt,
      ...NOTICE_VIEW,
    })
    .from(requestNotice)
    .innerJoin(request, eq(request.id, requestNotice.requestId))
}

type NoticeRow = Awaited<ReturnType<typeof requestNoticeRows>>[number]

/** The row as the bell reads it; `NotificationRow` refuses a decided notice of a request still open. */
export function requestNoticeView(row: NoticeRow): unknown {
  const common = {
    kind: row.kind,
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    read: row.readAt !== null,
    projectId: row.projectId,
    projectName: row.projectName,
    number: row.number,
  }
  return row.kind === 'REQUEST_OPENED'
    ? { ...common, requestedBy: { name: row.requestedByName } }
    : {
        ...common,
        outcome: row.state,
        decidedBy: row.decidedByName === null ? null : { name: row.decidedByName },
        reason: row.reason,
      }
}
