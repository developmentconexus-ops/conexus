import type { CompanyId, ConversationId, EventId } from '@conexus/hub-api'
import type { Runs } from '../runs/public.ts'
import type { Said } from './turn-log.ts'
import { eventId, SeenEvent, snapshotOf } from './turn-log.ts'

/** The most events a catch-up reads: a run past it is followed live and read whole once over. */
const CATCH_UP_EVENTS = 10_000

/**
 * What a stream that opens reads first, from the run journal (card, criterion 22): the events after
 * the last one it read, when that one is of the conversation's latest run; otherwise that run's
 * turn so far when the run is not over (it runs, waits on the person, or saves), or nothing. An id from elsewhere, of another conversation
 * too, names nothing here (security S10).
 */
export async function catchUp(
  runs: Runs,
  where: { companyId: CompanyId; conversationId: ConversationId },
  lastEventId: EventId | null,
): Promise<Said[]> {
  const { companyId, conversationId } = where
  const limit = CATCH_UP_EVENTS + 1
  const last = await runs.lastRunOf(companyId, conversationId)
  if (last === undefined) return []
  const seen = SeenEvent.safeParse(lastEventId)
  if (seen.success && seen.data[0] === last.id) {
    const rows = await runs.events({ companyId, runId: last.id, after: seen.data[1], limit })
    return rows.length > CATCH_UP_EVENTS
      ? []
      : rows.map(({ n, event }) => ({ id: eventId(last.id, n), event }))
  }
  if (!last.live) return []
  const rows = await runs.events({ companyId, runId: last.id, after: 0, limit })
  if (rows.length > CATCH_UP_EVENTS) return []
  const snapshot = snapshotOf(last.id, rows)
  return snapshot === undefined ? [] : [snapshot]
}
