import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { PageTitle } from '../../ui/list.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { AppsLayer } from './apps-layer.tsx'
import { NoteLine, useNote } from './copy-list.tsx'
import { NewCopy } from './new-copy.tsx'
import { copiesQuery } from './queries.ts'
import { RawLayer } from './raw-layer.tsx'
import { useRunRequests } from './run-requests.ts'
import { DataLayer } from './search.ts'
import { CATALOG_FAILED, CONCEPT_HINT, DATA_INTRO, DATA_TITLE, NO_CONCEPT } from './text.ts'

/** A route's `errorComponent` when the catalog could not be read: its sentence and a way to read again. */
export function DataReadFailure({ reset }: { error: unknown; reset: () => void }) {
  const router = useRouter()
  return <ReadFailure text={CATALOG_FAILED} onRetry={() => void router.invalidate().then(reset)} />
}

/** The **Negócio** layer: no concept is approved yet, and what a concept is. */
function BusinessLayer() {
  return (
    <div className="flex flex-col items-start gap-sm">
      <p className="font-medium">{NO_CONCEPT}</p>
      <Empty>{CONCEPT_HINT}</Empty>
    </div>
  )
}

/**
 * **Dados**: what the agents and the apps of the company can read, in the layer the address says
 * (web W18) and the tree chooses; **Ligar uma cópia** stays on top.
 */
export function DataPage(props: { companyId: CompanyId; layer: DataLayer; q: string | undefined }) {
  const { companyId, layer, q } = props
  const requests = useRunRequests()
  const read = useQuery(copiesQuery(companyId, requests))
  const [note, setNote] = useNote(read.data?.copies ?? [])
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-xl">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div className="flex min-w-0 flex-col gap-xs">
          <PageTitle>{DATA_TITLE}</PageTitle>
          <p className="max-w-message text-text-2">{DATA_INTRO}</p>
        </div>
        <NewCopy companyId={companyId} />
      </div>
      {note !== undefined && <NoteLine note={note} />}
      {layer === DataLayer.enum.raw && (
        <RawLayer companyId={companyId} read={read} q={q} onNote={setNote} />
      )}
      {layer === DataLayer.enum.business && <BusinessLayer />}
      {layer === DataLayer.enum.apps && <AppsLayer companyId={companyId} />}
    </div>
  )
}
