import { PageTitle } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { RouteReadFailure } from '../../ui/states.tsx'
import { AREA_TITLE } from './text.ts'

/** The frame of the area's page, which its loading and its failure keep too (web W34). */
export const AREA_FRAME =
  'mx-auto flex min-h-0 w-full max-w-page flex-1 flex-col gap-lg overflow-y-auto p-xl'

/** The area while its reads are on the way: the conversations and the list in skeleton. */
export function AreaPending() {
  return (
    <div role="status" aria-label="Carregando" className={AREA_FRAME}>
      <PageTitle>{AREA_TITLE}</PageTitle>
      <div className="grid items-start gap-xl md:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-md">
          <Skeleton className="h-28 w-full rounded-composer" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex flex-col gap-sm">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}

/** An agent's page while its read is on the way: the header and the columns in skeleton. */
export function AgentPending() {
  return (
    <div role="status" aria-label="Carregando" className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-xs border-b border-line px-md py-sm">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-56" />
      </div>
      <div className="grid min-h-0 flex-1 gap-md p-md md:grid-cols-[15rem_minmax(0,1fr)_24rem]">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="hidden h-40 w-full md:block" />
        <Skeleton className="hidden h-64 w-full md:block" />
      </div>
    </div>
  )
}

/** A failed read of the area or of an agent, inside the page's frame. */
export function AgentsReadFailure(props: Parameters<typeof RouteReadFailure>[0]) {
  return (
    <div className={AREA_FRAME}>
      <RouteReadFailure {...props} />
    </div>
  )
}
