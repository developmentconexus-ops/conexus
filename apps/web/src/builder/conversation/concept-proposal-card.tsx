import { ConceptProposed } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import {
  NOTHING_TO_PROPOSE,
  openProposalsQuery,
  PROPOSAL_DECIDED,
  REVIEW_AND_APPROVE,
} from '../../hub/ontology/public.ts'
import { buttonVariants } from '../../ui/button.tsx'
import type { ToolItem } from './rows.ts'

const company = getRouteApi('/_app/companies/$companyId')

function isConcept(target: string): boolean {
  return !target.includes('.') && !target.startsWith('@')
}

function titleOf(proposed: ConceptProposed): string {
  const concepts = proposed.items.filter((item) => isConcept(item.target)).length
  if (concepts > 0) return `Proposta: ${concepts} ${concepts === 1 ? 'conceito' : 'conceitos'}`
  return `Proposta: ${proposed.items.length} ${proposed.items.length === 1 ? 'item' : 'itens'}`
}

/** Whether the proposal still waits for a decision; a read that failed leaves the card as the tool left it. */
function Standing(props: { proposed: ConceptProposed }) {
  const { companyId } = company.useParams()
  const read = useQuery(openProposalsQuery(companyId))
  if (!read.isSuccess) return null
  const open = read.data.proposals.some((each) => each.id === props.proposed.proposalId)
  if (!open) return <p className="text-text-2">{PROPOSAL_DECIDED}</p>
  return (
    <div className="flex justify-end">
      <Link
        to="/companies/$companyId/knowledge"
        params={{ companyId }}
        search={{ aba: 'revisar' }}
        className={buttonVariants({ variant: 'primary' })}
      >
        {REVIEW_AND_APPROVE}
      </Link>
    </div>
  )
}

/**
 * The card of what `concept_propose` kept (A Ontologia da empresa, U4): the items with the rows
 * their proof counted, and **Revisar e aprovar**, which opens Para revisar, where whoever approves
 * decides and anyone else reads who it waits for.
 */
export function ConceptProposalCard({ tool }: { tool: Pick<ToolItem, 'result'> }) {
  const parsed = ConceptProposed.safeParse(tool.result)
  if (!parsed.success) return null
  const proposed = parsed.data
  if (proposed.items.length === 0)
    return (
      <div className="rounded-card border border-line bg-surface p-md text-text-2">
        {NOTHING_TO_PROPOSE}
      </div>
    )
  return (
    <div className="flex flex-col gap-sm rounded-card border border-line bg-surface p-md">
      <p className="break-words font-medium">{titleOf(proposed)}</p>
      <ul className="flex flex-col gap-xs">
        {proposed.items.map((item) => (
          <li key={item.n} className="break-words">
            <span className="font-mono text-fact">{item.target}</span>
            {item.proof !== undefined && (
              <span className="text-text-2 tabular-nums">{` · prova: ${item.proof.rows.toLocaleString('pt-BR')} linhas`}</span>
            )}
          </li>
        ))}
      </ul>
      <Standing proposed={proposed} />
    </div>
  )
}
