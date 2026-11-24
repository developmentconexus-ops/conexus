import type { CompanyId, ConnectionId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { assistantConnectionsQuery } from './queries.ts'

const NONE: ReadonlySet<ConnectionId> = new Set()

/**
 * The choice of the conversation not yet begun, with one owner: what the place offers, read from
 * the Hub, and what the person turned off. What the request creating the conversation carries is
 * the offer minus the turned-off ones at the moment of sending, so a new read of the offer never
 * undoes a switch. Without the offer read, `connections` is undefined and nothing may be sent.
 */
export function useDraftChoice(companyId: CompanyId, projectId: ProjectId | undefined) {
  const read = useQuery(assistantConnectionsQuery(companyId, projectId))
  const [held, setHeld] = useState({ project: projectId, unchosen: NONE })
  const unchosen = held.project === projectId ? held.unchosen : NONE
  const offered = read.data?.connections.map((one) => ({
    ...one,
    chosen: !unchosen.has(one.connectionId),
  }))
  return {
    read,
    offered,
    connections: offered?.filter((one) => one.chosen).map((one) => one.connectionId),
    toggle: (connectionId: ConnectionId, chosen: boolean) =>
      setHeld((was) => {
        const next = new Set(was.project === projectId ? was.unchosen : NONE)
        if (chosen) next.delete(connectionId)
        else next.add(connectionId)
        return { project: projectId, unchosen: next }
      }),
  }
}

export type DraftChoice = ReturnType<typeof useDraftChoice>
