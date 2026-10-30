import type { ConnectionNote } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import { violatedCheck } from '../../platform/database.ts'
import { personNameColumn } from '../identity/public.ts'
import type { Deps, OfConnection, Viewer } from './rows.ts'
import { admitted, ofCompany, scopeOf } from './rows.ts'
import { connection } from './tables.ts'

/** What the Builder proved about one concept of a company's system: names and codes, the query that proved it, never a value (founder, J1). */
export const Note = z.strictObject({
  mapping: z.string().min(1).max(500),
  provingQuery: z.string().min(1).max(4000),
  provedAt: z.iso.datetime(),
  provedRows: z.int().nonnegative(),
  writtenBy: z.string(),
})
export type Note = z.infer<typeof Note>

/** The connection's notebook as the database holds it, read by this schema (C27); the key is the concept. */
export const Notes = z.record(z.string().min(1).max(120), Note)
export type Notes = z.infer<typeof Notes>

/** The notebook, newest first, for the page of the connection; the writer is a name, null once they left the company. */
export async function notesOf(tx: ReadTx, input: OfConnection): Promise<ConnectionNote[]> {
  const [row] = await tx
    .select({ notes: connection.notes })
    .from(connection)
    .where(ofCompany(input, input.connectionId))
  const notes = Notes.parse(row?.notes ?? {})
  return Promise.all(
    Object.entries(notes)
      .sort(([, a], [, b]) => b.provedAt.localeCompare(a.provedAt))
      .map(async ([concept, note]) => {
        const [writer] = await tx
          .select({ name: personNameColumn(sql`${note.writtenBy}::text`) })
          .from(connection)
          .where(ofCompany(input, input.connectionId))
        return {
          concept,
          mapping: note.mapping,
          provedAt: note.provedAt,
          provedRows: note.provedRows,
          writtenBy: writer?.name ?? null,
        }
      }),
  )
}

/**
 * Writes one concept in one instruction (the row's lock): the same concept again is the last
 * writer's, two different both stay. The notebook above 32 KB is the database's refusal (23514).
 */
export async function save(
  deps: Deps,
  input: Viewer & { connectionId: OfConnection['connectionId']; concept: string; note: Note },
): Promise<'SAVED' | 'NOTE_INVALID'> {
  const note = Note.parse(input.note)
  try {
    await deps.database.command(scopeOf(input), (tx) =>
      tx
        .update(connection)
        .set({
          notes: sql`${connection.notes} || jsonb_build_object(${input.concept}::text, ${JSON.stringify(note)}::jsonb)`,
        })
        .where(ofCompany(input, input.connectionId)),
    )
  } catch (error) {
    if (violatedCheck(error) === 'connection_notes') return 'NOTE_INVALID'
    throw error
  }
  return 'SAVED'
}

/** Erases one concept; erasing one already gone answers the same. */
export function erase(deps: Deps, input: OfConnection & { concept: string }): Promise<void> {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    await tx
      .update(connection)
      .set({ notes: sql`${connection.notes} - ${input.concept}::text` })
      .where(ofCompany(input, input.connectionId))
  })
}
