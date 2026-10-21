import type { PersonId } from '@conexus/hub-api'
import type { z } from 'zod'
import { pageStorage } from './storage.ts'

/**
 * A list this browser remembers for each person: the name its key carries, the schema each id
 * parses with, and how many it keeps. Its owner builds it, so every read gives branded ids.
 */
export type RememberedList<Id extends z.ZodType<string>> = {
  name: string
  id: Id
  keep: number
}

const lists = pageStorage('local')

// Ids carry no space, so a list is stored as one line of ids separated by spaces.
const SEPARATOR = ' '

function keyOf(name: string, personId: PersonId): string {
  return `conexus-remembered:${personId}:${name}`
}

/**
 * What this browser remembers of `list` for the person, the last one first. A stored value that
 * does not parse as the list's id is dropped; the caller keeps only the ids the Hub still lists.
 */
export function recall<Id extends z.ZodType<string>>(input: {
  list: RememberedList<Id>
  personId: PersonId
}): z.output<Id>[] {
  const stored = lists.getItem(keyOf(input.list.name, input.personId)) ?? ''
  return stored.split(SEPARATOR).flatMap((raw) => {
    const id = input.list.id.safeParse(raw)
    return id.success ? [id.data] : []
  })
}

/**
 * Puts `id` first in the person's `list`, keeping the list's `keep` at most. A browser that refuses
 * storage remembers nothing, like a new one.
 */
export function remember<Id extends z.ZodType<string>>(input: {
  list: RememberedList<Id>
  personId: PersonId
  id: z.output<Id>
}): void {
  const { list, personId, id } = input
  const ids = [id, ...recall({ list, personId }).filter((one) => one !== id)].slice(0, list.keep)
  lists.setItem(keyOf(list.name, personId), ids.join(SEPARATOR))
}
