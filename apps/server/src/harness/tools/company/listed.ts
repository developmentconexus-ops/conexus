import type { ConnectionId } from '@conexus/hub-api'
import type { AccessView } from '../../../hub/access/public.ts'

type Detailed = { connectionId: ConnectionId; reads: readonly { operation: string }[] }

/** What a seat may name of the company's connections: only what its view lists. */
export type Listed<C extends Detailed> = readonly C[]

/**
 * The rule "the connection is in the view" (C26, C81): a connection the view lists no system of
 * leaves, and one it lists keeps only the reads the view lists; the view's order of systems wins.
 */
export function inView<C extends Detailed>(view: AccessView, details: readonly C[]): Listed<C> {
  return view.list('system').flatMap((system) => {
    const found = details.find((each) => each.connectionId === system.connection)
    if (found === undefined) return []
    const listed = new Set(system.reads.map((read) => read.operation))
    return [{ ...found, reads: found.reads.filter((read) => listed.has(read.operation)) }]
  })
}
