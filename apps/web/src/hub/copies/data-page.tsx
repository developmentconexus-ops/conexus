import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { PageTitle } from '../../ui/list.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { AppsLayer } from './apps-layer.tsx'
import { useMay, useOwnRoleLabel } from './member.ts'
import { copiesQuery } from './queries.ts'
import { RawLayer } from './raw-layer.tsx'
import { DataLayer } from './search.ts'
import {
  CATALOG_FAILED,
  CONCEPT_HINT,
  DATA_INTRO,
  DATA_TITLE,
  NO_CONCEPT,
  roleTablesText,
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

/** What a member reads under the title: whose tables the page lists; nothing until the role is named. */
function RoleNote({ companyId }: { companyId: CompanyId }) {
  const label = useOwnRoleLabel(companyId)
  return label === undefined ? null : (
    <p className="max-w-message text-text-2">{roleTablesText(label)}</p>
  )
}

export function DataPage(props: { companyId: CompanyId; layer: DataLayer; q: string | undefined }) {
  const { companyId, q } = props
  const may = useMay()
  const layer =
    props.layer === DataLayer.enum.apps && !may.viewAppData ? DataLayer.enum.raw : props.layer
  const read = useQuery(copiesQuery(companyId))
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-xl">
      <div className="flex min-w-0 flex-col gap-xs">
        <PageTitle>{DATA_TITLE}</PageTitle>
        <p className="max-w-message text-text-2">{DATA_INTRO}</p>
        {!may.manageCopies && <RoleNote companyId={companyId} />}
      </div>
      {layer === DataLayer.enum.raw && (
        <RawLayer companyId={companyId} read={read} q={q} manage={may.manageCopies} />
      )}
      {layer === DataLayer.enum.business && <BusinessLayer />}
      {layer === DataLayer.enum.apps && <AppsLayer companyId={companyId} />}
    </div>
  )
}
