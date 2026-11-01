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
  const writers = [...new Set(Object.values(notes).map((note) => note.writtenBy))]
  const names = new Map<string, string | null>()
  if (writers.length > 0) {
    // One read for every writer, through the identity's own name column.
    const listed = sql.join(
      writers.map((id) => sql`${id}`),
      sql`, `,
    )
    const read = await tx
      .select({ id: sql<string>`writer.id`, name: personNameColumn(sql`writer.id`) })
      .from(sql`unnest(array[${listed}]::text[]) as writer(id)`)
    for (const { id, name } of read) names.set(id, name)
  }
  return Object.entries(notes)
    .sort(([, a], [, b]) => b.provedAt.localeCompare(a.provedAt))
    .map(([concept, note]) => ({
      concept,
      mapping: note.mapping,
      provedAt: note.provedAt,
      provedRows: note.provedRows,
      writtenBy: names.get(note.writtenBy) ?? null,
    }))
}

/**
 * Writes one concept in one instruction (the row's lock): the same concept again is the last
 * writer's, two different both stay. The notebook above 32 KB is the database's refusal (23514). A
 * connection taken off between the admission and this write is `GONE`, never `SAVED`.
 */
export async function save(
  deps: Deps,
  input: Viewer & { connectionId: OfConnection['connectionId']; concept: string; note: Note },
): Promise<'SAVED' | 'NOTE_INVALID' | 'GONE'> {
  const note = Note.parse(input.note)
  try {
    const written = await deps.database.command(scopeOf(input), (tx) =>
      tx
        .update(connection)
        .set({
          notes: sql`${connection.notes} || jsonb_build_object(${input.concept}::text, ${JSON.stringify(note)}::jsonb)`,
        })
        .where(ofCompany(input, input.connectionId))
        .returning({ id: connection.id }),
    )
    return written.length === 0 ? 'GONE' : 'SAVED'
  } catch (error) {
    if (violatedCheck(error) === 'connection_notes') return 'NOTE_INVALID'
    throw error
  }
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
