import type { CompanyId, TreatedTable } from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import { List, Row } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Approve } from './approve.tsx'
import { useMay } from './may.ts'
import { NewTreatment } from './new-treatment.tsx'
import { useTreatedTables } from './queries.ts'
import { activeLine, NO_TREATMENT, proposalLine, READ_FAILED, runText } from './text.ts'

type Model = Extract<TreatedTable, { layer: 'negocio' }>

/** What the bound version says about itself, with the rows and the hour of its last good run. */
function activeText(model: Model): string | null {
  if (model.active === null) return null
  const last = model.lastRun === null ? '' : ` · ${runText(model.lastRun)}`
  return `${activeLine(model.active)}${last}`
}

function Line({ companyId, model }: { companyId: CompanyId; model: Model }) {
  const active = activeText(model)
  return (
    <Row>
      <div className="flex flex-wrap items-start justify-between gap-md px-sm py-md">
        <div className="flex min-w-0 flex-col gap-xs">
          <Link
            to="/companies/$companyId/data/business/$modelId"
            params={{ companyId, modelId: model.id }}
            className="w-fit break-all font-mono text-fact font-medium underline-offset-2 hover:underline"
          >
            {model.name}
          </Link>
          {model.description !== '' && (
            <span className="break-words text-text-2">{model.description}</span>
          )}
          {active !== null && <span className="text-text-2 tabular-nums">{active}</span>}
          {model.proposal !== null && (
            <span className="text-text-2">{proposalLine(model.proposal.number)}</span>
          )}
        </div>
        {model.proposal !== null && (
          <Approve
            companyId={companyId}
            modelId={model.id}
            name={model.name}
            proposal={model.proposal}
          />
        )}
      </div>
    </Row>
  )
}

/** The **Negócio** layer: the treatments of the company, each with its bound version and the proposal that waits for the yes. */
export function BusinessLayer({ companyId }: { companyId: CompanyId }) {
  const may = useMay()
  const treated = useTreatedTables(companyId)
  if (treated.isPending) return <Skeleton className="h-24 w-full" />
  if (treated.isError) {
    return <ReadFailure text={READ_FAILED} onRetry={() => void treated.refetch()} />
  }
  const models = treated.data.tables.filter((table): table is Model => table.layer === 'negocio')
  return (
    <div className="flex flex-col gap-lg">
      {may.proposeTreatment && (
        <div className="flex flex-wrap items-center gap-md">
          <NewTreatment companyId={companyId} />
        </div>
      )}
      {models.length === 0 ? (
        <p className="font-medium">{NO_TREATMENT}</p>
      ) : (
        <List>
          {models.map((model) => (
            <Line key={model.id} companyId={companyId} model={model} />
          ))}
        </List>
      )}
    </div>
  )
}
