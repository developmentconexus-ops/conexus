import { randomUUID } from 'node:crypto'
import type { SQL } from 'drizzle-orm'
import { desc, sql } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import type { NoticeRequests } from '../requests/public.ts'
import { noticeViewsOf } from '../requests/public.ts'
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

/**
 * The bell's columns of a page of a person's request notices, each with what its request says now.
 * The foreign key cascades and the request's row policy is the company's, so every notice has its
 * request; one that has none is a broken invariant, not a row to leave out.
 */
export async function requestNoticeRows(tx: ReadTx, where: SQL | undefined, limit: number) {
  const notices = await tx
    .select({
      id: requestNotice.id,
      requestId: requestNotice.requestId,
      kind: requestNotice.kind,
      createdAt: requestNotice.createdAt,
      micros: microsOf(requestNotice.createdAt),
      readAt: requestNotice.readAt,
    })
    .from(requestNotice)
    .where(where)
    .orderBy(desc(requestNotice.createdAt), desc(requestNotice.id))
    .limit(limit)
  const views = await noticeViewsOf(
    tx,
    notices.map((notice) => notice.requestId),
  )
  return notices.map((notice) => {
    const view = views.get(notice.requestId)
    if (view === undefined) throw new Error(`The request ${notice.requestId} of a notice is gone`)
    return { ...view, ...notice }
  })
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
