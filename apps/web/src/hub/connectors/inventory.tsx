import type { CompanyId, ConnectionId, InventoryView } from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { inventoryQuery, sendInventoryRun } from './queries.ts'
import {
  INVENTORY_FAILED,
  INVENTORY_PARTIAL,
  inventoryText,
  READ_AGAIN,
  READING_INVENTORY,
} from './text.ts'

/** How often the block asks again while a run is open: a run takes seconds to minutes. */
const WHILE_RUNNING_MS = 2_000

/** The sentence of what the last run left, after the summary: none when it went well. */
function stateOf(view: InventoryView): string | undefined {
  if (view.last?.outcome === 'FAILED' || view.last?.outcome === 'INTERRUPTED')
    return INVENTORY_FAILED
  if (view.inventory === null) return view.running ? undefined : INVENTORY_FAILED
  return view.inventory.outcome === 'PARTIAL' ? INVENTORY_PARTIAL : undefined
}

function Summary({ view }: { view: InventoryView }) {
  const state = stateOf(view)
  return (
    <div className="flex flex-col gap-xs">
      {view.inventory !== null && <p className="text-fact">{inventoryText(view.inventory)}</p>}
      {view.running && (
        <p role="status" className="text-text-2">
          {READING_INVENTORY}
        </p>
      )}
      {!view.running && state !== undefined && <Alert tone="danger">{state}</Alert>}
    </div>
  )
}

/**
 * The connection's Inventário: the counts of what its system declares about itself, with the date
 * of the reading, and **Ler de novo** for who manages the connections. Every member reads it. A run
 * that is open shows its sentence and the block asks again until it ends.
 */
export function Inventory(props: { companyId: CompanyId; connectionId: ConnectionId }) {
  const { companyId, connectionId } = props
  const queryClient = useQueryClient()
  const query = useQuery({
    ...inventoryQuery(companyId, connectionId),
    refetchInterval: (read) => (read.state.data?.running === true ? WHILE_RUNNING_MS : false),
  })
  const again = useMutation({
    ...sendInventoryRun,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: inventoryQuery(companyId, connectionId).queryKey }),
  })
  if (query.isPending)
    return (
      <div role="status" aria-label="Carregando o inventário">
        <Skeleton className="h-12 w-full max-w-message" />
      </div>
    )
  if (query.isError)
    return <ReadFailure text={sentenceOf(query.error)} onRetry={() => void query.refetch()} />
  const view = query.data
  return (
    <section aria-label="Inventário" className="flex flex-wrap items-start justify-between gap-md">
      <Summary view={view} />
      {view.mayRun && (
        <Button
          disabled={view.running || again.isPending}
          onClick={() => again.mutate({ params: { companyId, connectionId } })}
        >
          {READ_AGAIN}
        </Button>
      )}
      {again.isError && <Alert tone="danger">{sentenceOf(again.error)}</Alert>}
    </section>
  )
}
