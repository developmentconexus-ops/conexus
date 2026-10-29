import type { CompanyId, Connection, ConnectorEntry } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { ChevronRightIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../ui/badge.tsx'
import { Button } from '../../ui/button.tsx'
import { List, PageTitle, Row, rowBody, SectionTitle } from '../../ui/list.tsx'
import { Empty } from '../../ui/states.tsx'
import { LinkDialog } from './link-dialog.tsx'
import { ConnectorLogo } from './logo.tsx'
import { connectionsQuery } from './queries.ts'
import {
  ALL_LINKED,
  connectionsCount,
  LEAD,
  linkedText,
  MEMBER_SENTENCE,
  NO_CONNECTIONS,
  stateBadge,
  testedText,
} from './text.ts'

const route = getRouteApi('/_app/companies/$companyId/integrations/')

function ConnectionLink(props: { companyId: CompanyId; connection: Connection }) {
  const { connection } = props
  const badge = stateBadge(connection)
  return (
    <Link
      to="/companies/$companyId/integrations/$connectionId"
      params={{ companyId: props.companyId, connectionId: connection.id }}
      className={rowBody({ kind: 'link' })}
    >
      <span className="flex min-w-0 flex-col gap-xs">
        <span className="font-medium">{connection.name}</span>
        <span className="text-text-2">{linkedText(connection)}</span>
      </span>
      <span className="flex shrink-0 items-center gap-sm">
        {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
        {connection.testedAt !== null && (
          <span className="hidden text-text-2 sm:inline">{testedText(connection.testedAt)}</span>
        )}
        <ChevronRightIcon aria-hidden="true" className="size-4 text-text-2" />
      </span>
    </Link>
  )
}

function ConnectorHead(props: {
  entry: ConnectorEntry
  detail: string
  action: { ariaLabel: string; ghost: boolean; onLink: () => void } | null
}) {
  const { entry } = props
  return (
    <div className="flex items-center gap-md px-sm py-md">
      <ConnectorLogo entry={entry} />
      <div className="flex min-w-0 flex-1 flex-col gap-xs">
        <span className="flex flex-wrap items-center gap-x-sm gap-y-xs">
          <span className="font-medium">{entry.name}</span>
          <Badge>{entry.category}</Badge>
        </span>
        <span className="text-text-2">{props.detail}</span>
      </div>
      {props.action && (
        <Button
          size="sm"
          variant={props.action.ghost ? 'ghost' : 'default'}
          aria-label={props.action.ariaLabel}
          onClick={props.action.onLink}
        >
          <PlusIcon aria-hidden="true" />
          Ligar
        </Button>
      )}
    </div>
  )
}

/**
 * "Integrações": the outside systems the company linked, grouped by connector with each of its
 * connections, and the catalog it can still link from. An owner or an administrator links; a
 * member reads and is told who can (web W34, design V29), the Hub's `mayManage`.
 */
export function Integrations() {
  const { companyId } = route.useParams()
  const { connectors, connections, mayManage } = useSuspenseQuery(connectionsQuery(companyId)).data
  const [linking, setLinking] = useState<ConnectorEntry>()
  const groups = connectors
    .map((entry) => ({ entry, own: connections.filter((one) => one.connector === entry.id) }))
    .filter((group) => group.own.length > 0)

  return (
    <div className="flex w-full max-w-page flex-col gap-xl">
      <div className="flex flex-col gap-sm">
        <PageTitle>Integrações</PageTitle>
        <p className="text-text-2">{LEAD}</p>
      </div>
      {!mayManage && <p className="text-text-2">{MEMBER_SENTENCE}</p>}
      <section aria-label="Ligadas" className="flex flex-col gap-md">
        <SectionTitle>Ligadas</SectionTitle>
        {groups.length === 0 ? (
          <Empty>{NO_CONNECTIONS}</Empty>
        ) : (
          <List>
            {groups.map(({ entry, own }) => (
              <Row key={entry.id}>
                <ConnectorHead
                  entry={entry}
                  detail={connectionsCount(own.length)}
                  action={
                    mayManage
                      ? {
                          ariaLabel: `Ligar outra ligação do ${entry.name}`,
                          ghost: true,
                          onLink: () => setLinking(entry),
                        }
                      : null
                  }
                />
                <ul className="ml-14 border-t border-line">
                  {own.map((connection) => (
                    <Row key={connection.id}>
                      <ConnectionLink companyId={companyId} connection={connection} />
                    </Row>
                  ))}
                </ul>
              </Row>
            ))}
          </List>
        )}
      </section>
      <section aria-label="Para ligar" className="flex flex-col gap-md">
        <SectionTitle>Para ligar</SectionTitle>
        {connectors.length === 0 ? (
          <Empty>{ALL_LINKED}</Empty>
        ) : (
          <List>
            {connectors.map((entry) => (
              <Row key={entry.id}>
                <ConnectorHead
                  entry={entry}
                  detail={entry.summary}
                  action={
                    mayManage
                      ? {
                          ariaLabel: `Ligar ${entry.name}`,
                          ghost: false,
                          onLink: () => setLinking(entry),
                        }
                      : null
                  }
                />
              </Row>
            ))}
          </List>
        )}
      </section>
      {linking && (
        <LinkDialog
          companyId={companyId}
          entry={linking}
          connections={connections}
          onClose={() => setLinking(undefined)}
        />
      )}
    </div>
  )
}
