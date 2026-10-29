import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { List, PageTitle, Row, SectionTitle } from '../../ui/list.tsx'
import { Empty } from '../../ui/states.tsx'
import { ConnectionRow } from './connection-row.tsx'
import { LinkDialog } from './link-dialog.tsx'
import { connectionsQuery } from './queries.ts'
import { connectorName, MEMBER_SENTENCE, NO_CONNECTIONS } from './text.ts'

const route = getRouteApi('/_app/companies/$companyId/integrations')

/**
 * "Integrações": the outside systems the company linked and the ones it can still link. An owner or
 * an administrator links, tests and unlinks; a member reads the state and is told who can (web W34,
 * design V29), the Hub's `mayManage`.
 */
export function Integrations() {
  const { companyId } = route.useParams()
  const { data, dataUpdatedAt } = useSuspenseQuery(connectionsQuery(companyId))
  const { connectors, connections, mayManage } = data
  const linked = useRef<HTMLElement>(null)
  const toLink = connectors.filter((one) => !connections.some((c) => c.connector === one.id))
  const [notice, setNotice] = useState<string>()
  const shape = `${connections.length}:${toLink.length}`
  const seen = useRef(shape)
  const settledAt = useRef<number | undefined>(undefined)
  // What a row or a dialog settled: the sentence a refusal leaves above the rows, if there is one.
  function settled(refusal?: string) {
    settledAt.current = dataUpdatedAt
    setNotice(refusal)
  }
  // A dialog's button leaves with its row, so once the list is read again focus goes to the list.
  // That read is the only one the settling waits for: when the list kept its shape, nothing moves.
  useEffect(() => {
    if (settledAt.current !== undefined && settledAt.current !== dataUpdatedAt) {
      if (seen.current !== shape) linked.current?.focus()
      settledAt.current = undefined
    }
    seen.current = shape
  }, [dataUpdatedAt, shape])

  return (
    <div className="flex w-full max-w-page flex-col gap-xl">
      <PageTitle>Integrações</PageTitle>
      {!mayManage && <p className="text-text-2">{MEMBER_SENTENCE}</p>}
      <section ref={linked} tabIndex={-1} aria-label="Ligadas" className="flex flex-col gap-md">
        <SectionTitle>Ligadas</SectionTitle>
        {notice !== undefined && (
          <p role="alert" className="text-danger">
            {notice}
          </p>
        )}
        {connections.length === 0 ? (
          <Empty>{NO_CONNECTIONS}</Empty>
        ) : (
          <List>
            {connections.map((connection) => (
              <ConnectionRow
                key={connection.id}
                companyId={companyId}
                connection={connection}
                name={connectorName(connectors, connection.connector)}
                mayManage={mayManage}
                onAttempt={() => setNotice(undefined)}
                onSettled={settled}
              />
            ))}
          </List>
        )}
      </section>
      <section aria-label="Para ligar" className="flex flex-col gap-md">
        <SectionTitle>Para ligar</SectionTitle>
        {toLink.length === 0 ? (
          <Empty>Nenhum outro conector ainda.</Empty>
        ) : (
          <List>
            {toLink.map((entry) => (
              <Row key={entry.id}>
                <div className="flex flex-wrap items-center justify-between gap-md px-sm py-md">
                  <span className="font-medium">{entry.name}</span>
                  {mayManage && (
                    <LinkDialog
                      companyId={companyId}
                      entry={entry}
                      onAttempt={() => setNotice(undefined)}
                      onLinked={settled}
                    />
                  )}
                </div>
              </Row>
            ))}
          </List>
        )}
      </section>
    </div>
  )
}
