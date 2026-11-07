import { useQuery } from '@tanstack/react-query'
import { connectionsQuery, stateBadge } from '../../hub/connectors/public.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Badge } from '../../ui/badge.tsx'
import { Button } from '../../ui/button.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Checkbox } from '../../ui/checkbox.tsx'
import { Logo, useConnectorCatalog } from '../assistant/public.ts'
import { ConnectionTools } from './connection-tools.tsx'
import type { Part } from './section.tsx'
import { Section } from './section.tsx'
import { GONE_CONNECTION, NO_CONNECTIONS } from './text.ts'
import { useDraftSave } from './use-draft-save.ts'

/**
 * **Ligações** (decision E4): the Projeto's connections as selectors, each with its connector's logo
 * and its state. Selecting one gives nothing by itself: it shows the connection's tools beneath,
 * none marked.
 */
export function Connections({ scope, agent }: Part) {
  const saving = useDraftSave(scope, agent.id)
  const catalog = useConnectorCatalog(scope.companyId)
  const linked = useQuery(connectionsQuery(scope.companyId))
  const chosen = agent.draft.connections
  const gone = chosen.filter((id) => !agent.offered.some((one) => one.connectionId === id))
  function change(id: (typeof chosen)[number], on: boolean) {
    saving.save((now) => {
      const others = now.draft.connections.filter((one) => one !== id)
      if (on) return { connections: [...others, id] }
      // Taking the selection away takes the connection's tools out of the draft with it.
      const leaving = now.tools.filter((tool) => tool.connectionId === id)
      return {
        connections: others,
        tools: now.tools.filter((tool) => !leaving.includes(tool)).map((tool) => tool.version.id),
      }
    })
  }
  function badgeOf(connectionId: string, connector: string) {
    const connection = linked.data?.connections.find((one) => one.id === connectionId)
    const entry = linked.data?.connectors.find((one) => one.id === connector)
    return connection === undefined || entry === undefined
      ? null
      : stateBadge(connection, entry.auth)
  }
  return (
    <Section title="Ligações" busy={saving.pending} error={saving.error}>
      {linked.isError && (
        <ReadFailure text={sentenceOf(linked.error)} onRetry={() => void linked.refetch()} />
      )}
      {agent.offered.length === 0 && gone.length === 0 && (
        <p className="text-text-2">{NO_CONNECTIONS}</p>
      )}
      {agent.offered.map((one) => {
        const badge = badgeOf(one.connectionId, one.connector)
        const label = `${catalog.name(one.connector)} · ${one.name}`
        const selected = chosen.includes(one.connectionId)
        return (
          <div key={one.connectionId} className="flex flex-col gap-xs">
            <div className="flex items-center gap-sm">
              <Checkbox
                id={`connection-${one.connectionId}`}
                checked={selected}
                onCheckedChange={(on) => change(one.connectionId, on)}
              />
              <Logo logo={catalog.logo(one.connector)} />
              <label htmlFor={`connection-${one.connectionId}`} className="min-w-0 flex-1 truncate">
                {label}
              </label>
              {badge !== null && <Badge tone={badge.tone}>{badge.text}</Badge>}
            </div>
            {selected && (
              <ConnectionTools scope={scope} agent={agent} connection={one} saving={saving} />
            )}
          </div>
        )
      })}
      {gone.map((id) => (
        <div key={id} className="flex items-center justify-between gap-md text-danger">
          <span>{GONE_CONNECTION}</span>
          <Button size="sm" variant="ghost" onClick={() => change(id, false)}>
            Tirar
          </Button>
        </div>
      ))}
    </Section>
  )
}
