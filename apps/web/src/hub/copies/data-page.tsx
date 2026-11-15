import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { PageTitle } from '../../ui/list.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { NoteLine, useNote } from './copy-list.tsx'
import { NewCopy } from './new-copy.tsx'
import { copiesQuery } from './queries.ts'
import { RawLayer } from './raw-layer.tsx'
import { useRunRequests } from './run-requests.ts'
import { DataLayer } from './search.ts'
import {
  CATALOG_FAILED,
  CONCEPT_HINT,
  DATA_INTRO,
  DATA_LAYERS,
  DATA_TITLE,
  NO_CONCEPT,
} from './text.ts'

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
 * **Dados**: what the agents and the apps of the company can read, in the layers **Bruto** and
 * **Negócio**, the layer in the address (web W18). The copies of the company are read here once, for the
 * count of the tab and for the Bruto layer; **Ligar uma cópia** stays on top.
 */
export function DataPage(props: { companyId: CompanyId; layer: DataLayer; q: string | undefined }) {
  const { companyId, layer, q } = props
  const requests = useRunRequests()
  const read = useQuery(copiesQuery(companyId, requests))
  const [note, setNote] = useNote(read.data?.copies ?? [])
  const navigate = useNavigate()
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
      <Tabs
        value={layer}
        onValueChange={(next) => {
          const chosen = DataLayer.safeParse(next)
          if (chosen.success) void navigate({ to: '.', search: { layer: chosen.data } })
        }}
      >
        <TabsList aria-label="Camada">
          <TabsTrigger value={DataLayer.enum.raw}>
            {DATA_LAYERS.raw}
            {read.data !== undefined && (
              <span className="text-text-2 tabular-nums">{read.data.copies.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value={DataLayer.enum.business}>
            {DATA_LAYERS.business}
            <span className="text-text-2 tabular-nums">0</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value={DataLayer.enum.raw} className="pt-md">
          <RawLayer companyId={companyId} read={read} q={q} onNote={setNote} />
        </TabsContent>
        <TabsContent value={DataLayer.enum.business} className="pt-md">
          <BusinessLayer />
        </TabsContent>
      </Tabs>
    </div>
  )
}
