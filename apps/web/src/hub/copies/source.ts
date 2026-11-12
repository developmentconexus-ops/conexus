import type { CompanyId, CopyOrigin, CopySummary } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { connectionsQuery, connectorName } from '../connectors/public.ts'

/** Where a copy or a proposal reads: the source, its connector, and the accounts' names in order. */
export type Origin = Readonly<{
  source: CopyOrigin
  connector: string
  accounts: readonly string[]
}>

export function originOf(copy: Pick<CopySummary, 'shown' | 'sources'>): Origin {
  return {
    source: copy.shown.source,
    connector: copy.sources[0]?.connection.connector ?? '',
    accounts: copy.sources.map((each) => each.connection.name),
  }
}

/**
 * The Fonte in words: a list read by its label and the connector's name, which the catalog of
 * Integrações gives (until it is read, the label alone); a query by its connection, as before.
 */
export function useSourceText(companyId: CompanyId): (origin: Origin) => string {
  const read = useQuery(connectionsQuery(companyId))
  return (origin) => {
    if (origin.source.kind === 'QUERY') return origin.accounts.join(', ')
    const { label } = origin.source
    if (read.data === undefined) return label
    return `${label} · ${connectorName(read.data.connectors, origin.connector)}`
  }
}

/** The accounts a list read copies, by the names the company gave them; a query's one connection is already its Fonte. */
function accountsText(origin: Origin): string | null {
  return origin.source.kind === 'QUERY' ? null : origin.accounts.join(', ')
}

/** A line led by the accounts of a list read: "Loja A, Loja B · só o alterado"; a query's line as it was. */
export function withAccounts(origin: Origin, line: string): string {
  const accounts = accountsText(origin)
  return accounts === null ? line : `${accounts} · ${line}`
}
