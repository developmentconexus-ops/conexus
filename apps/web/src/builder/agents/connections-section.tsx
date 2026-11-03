import { useQuery } from '@tanstack/react-query'
import { connectionsQuery, stateBadge } from '../../hub/connectors/public.ts'
import { Badge } from '../../ui/badge.tsx'
import { Button } from '../../ui/button.tsx'
import { Switch } from '../../ui/switch.tsx'
import { Logo, useConnectorCatalog } from '../assistant/public.ts'
import type { Part } from './section.tsx'
import { Section } from './section.tsx'
import { GONE_CONNECTION, NO_CONNECTIONS } from './text.ts'
import { useDraftSave } from './use-draft-save.ts'

/** **Ligações**: the Projeto's connections, each with its connector's logo and its state, on or off for the agent. */
export function Connections({ scope, agent }: Part) {
  const saving = useDraftSave(scope, agent.id)
  const catalog = useConnectorCatalog(scope.companyId)
  const linked = useQuery(connectionsQuery(scope.companyId))
  const chosen = agent.draft.connections
  const gone = chosen.filter((id) => !agent.offered.some((one) => one.connectionId === id))
  function change(id: (typeof chosen)[number], on: boolean) {
    saving.save((now) => {
      const others = now.draft.connections.filter((one) => one !== id)
      return { connections: on ? [...others, id] : others }
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
      {agent.offered.length === 0 && gone.length === 0 && (
        <p className="text-text-2">{NO_CONNECTIONS}</p>
      )}
      {agent.offered.map((one) => {
        const badge = badgeOf(one.connectionId, one.connector)
        const label = `${catalog.name(one.connector)} · ${one.name}`
        return (
          <div key={one.connectionId} className="flex items-center justify-between gap-md">
            <span className="flex min-w-0 items-center gap-sm">
              <Logo logo={catalog.logo(one.connector)} />
              <label htmlFor={`connection-${one.connectionId}`} className="truncate">
                {label}
              </label>
              {badge !== null && <Badge tone={badge.tone}>{badge.text}</Badge>}
            </span>
            <Switch
              id={`connection-${one.connectionId}`}
              checked={chosen.includes(one.connectionId)}
              onCheckedChange={(on) => change(one.connectionId, on)}
            />
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
