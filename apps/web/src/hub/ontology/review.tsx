import type {
  CompanyId,
  DecisionGap,
  ElementBefore,
  OntologyView,
  ProposalItemView,
  ProposalView,
} from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { HubFailure, sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { Checkbox } from '../../ui/checkbox.tsx'
import { Input } from '../../ui/input.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { ontologyQuery, openProposalsQuery, sendDecision } from './queries.ts'
import {
  AWAITS,
  itemText,
  NOTHING_TO_REVIEW,
  PROPOSAL_DECIDED,
  plural,
  SEE_AGAIN,
  TO_HISTORY,
  UNCONFIRMED_DECISION,
  when,
} from './text.ts'
import { Waiting } from './waiting.tsx'

/** What the person chose of one pending item: approved, or refused with a reason. */
type Choice = { approve: boolean; reason: string }
type Choices = ReadonlyMap<number, Choice>

const GAP_TEXT = {
  SOURCE: 'falta de onde ler',
  FIELD: 'falta o campo',
  CONCEPT: 'falta o conceito',
  BASE: 'falta o conceito de base',
  REPLACEMENT: 'falta o que o substitui',
  ACTIVE_ROLE: 'tem papel ainda ativo',
} as const satisfies Record<DecisionGap['needs'], string>

function gapText(gap: DecisionGap): string {
  return `${gap.target}: ${GAP_TEXT[gap.needs]} ${gap.address}`
}

function choicesOf(proposal: Pick<ProposalView, 'items'>): Choices {
  return new Map(
    proposal.items
      .filter((item) => item.decision === 'PENDING')
      .map((item) => [item.n, { approve: true, reason: '' }]),
  )
}

/** The body of a decision over the chosen items, or nothing while a refusal has no reason. */
export function decisionOf(choices: Choices, expectedRevision: number) {
  const approved: number[] = []
  const refused: { n: number; reason: string }[] = []
  for (const [n, choice] of choices) {
    if (choice.approve) approved.push(n)
    else if (choice.reason.trim() === '') return undefined
    else refused.push({ n, reason: choice.reason.trim() })
  }
  return approved.length + refused.length === 0
    ? undefined
    : { approved, refused, expectedRevision }
}

function decideLabel(choices: Choices): string {
  const refused = [...choices.values()].filter((each) => !each.approve).length
  const approved = choices.size - refused
  if (refused === 0) return 'Aprovar todos'
  return approved === 0 ? `Recusar ${refused}` : `Aprovar ${approved} e recusar ${refused}`
}

function nameBefore(before: ElementBefore): string {
  switch (before.kind) {
    case 'CODE':
      return before.label
    case 'RELATION':
      return before.fromName
    case 'CONCEPT':
    case 'FIELD':
      return before.name
    default:
      return before satisfies never
  }
}

function afterName(item: ProposalItemView['item']): string | undefined {
  return item.kind === 'RENAME_LABEL' ? item.name : undefined
}

function Change({ item }: { item: ProposalItemView }) {
  const after = afterName(item.item)
  return (
    <>
      <p className="break-words">{itemText(item.item)}</p>
      {item.before !== null && after !== undefined && (
        <p className="break-words text-text-2">{`antes ${nameBefore(item.before)} · depois ${after}`}</p>
      )}
      {item.proof !== null && (
        <p className="text-text-2 tabular-nums">{`Prova: ${plural(item.proof.rows, 'linha', 'linhas')}`}</p>
      )}
    </>
  )
}

function ItemRow(props: {
  item: ProposalItemView
  choice: Choice | undefined
  gaps: readonly DecisionGap[]
  onChange: ((next: Choice) => void) | undefined
}) {
  const { item, choice, onChange } = props
  const marked = props.gaps.filter((gap) => gap.n === item.n)
  return (
    <li className="flex flex-col gap-xs border-b border-line py-md last:border-b-0">
      <div className="flex items-start gap-sm">
        {choice !== undefined && onChange !== undefined && (
          <Checkbox
            aria-label={`Aprovar: ${itemText(item.item)}`}
            checked={choice.approve}
            onCheckedChange={(approve) => onChange({ ...choice, approve })}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-xs">
          <Change item={item} />
          {item.decision !== 'PENDING' && (
            <p className="text-text-2">{item.decision === 'APPROVED' ? 'aprovado' : 'recusado'}</p>
          )}
        </div>
      </div>
      {choice !== undefined && !choice.approve && onChange !== undefined && (
        <Input
          aria-label={`Motivo da recusa: ${itemText(item.item)}`}
          value={choice.reason}
          maxLength={500}
          onChange={(event) => onChange({ ...choice, reason: event.target.value })}
        />
      )}
      {marked.map((gap) => (
        <Alert key={gapText(gap)} tone="danger">
          {gapText(gap)}
        </Alert>
      ))}
    </li>
  )
}

/** What a refused decision tells: the stale revision asks to read again, an incomplete set marks the items. */
type Told = { text: string; gaps: DecisionGap[]; decided: boolean; stale: boolean }

function toldOf(error: unknown): Told {
  const code = error instanceof HubFailure && !error.outcomeUnknown ? error.code : undefined
  const decided = code === 'ITEM_DECIDED' || code === 'NOT_FOUND'
  return {
    text: decided ? PROPOSAL_DECIDED : writeFailureText(error, UNCONFIRMED_DECISION),
    gaps: error instanceof HubFailure ? (error.gaps ?? []) : [],
    decided,
    stale: code === 'REVISION_STALE',
  }
}

function ProposalBlock(props: {
  companyId: CompanyId
  proposal: ProposalView
  view: OntologyView
}) {
  const { companyId, proposal, view } = props
  const queryClient = useQueryClient()
  const send = useMutation(sendDecision)
  const [choices, setChoices] = useState<Choices>(() => choicesOf(proposal))
  const [told, setTold] = useState<Told>()
  const body = decisionOf(choices, view.revision?.number ?? 0)

  function change(n: number, next: Choice) {
    setChoices(new Map(choices).set(n, next))
  }
  function decide() {
    if (body === undefined) return
    setTold(undefined)
    send.mutate(
      { params: { companyId, proposalId: proposal.id }, body },
      { onError: (error) => setTold(toldOf(error)) },
    )
  }
  function again() {
    setTold(undefined)
    void queryClient.invalidateQueries({ queryKey: ontologyQuery(companyId).queryKey })
    void queryClient.invalidateQueries({ queryKey: openProposalsQuery(companyId).queryKey })
  }

  return (
    <section aria-label={proposal.demand} className="flex flex-col gap-sm">
      <div className="flex flex-col gap-xs">
        <h3 className="break-words font-display text-title">{proposal.demand}</h3>
        <p className="text-text-2">
          {`${proposal.agent === null ? 'por um membro' : 'pelo Builder'} · ${plural(proposal.items.length, 'item', 'itens')} · ${when(proposal.createdAt)}`}
        </p>
      </div>
      <ul>
        {proposal.items.map((item) => (
          <ItemRow
            key={item.n}
            item={item}
            choice={view.mayApprove ? choices.get(item.n) : undefined}
            gaps={told?.gaps ?? []}
            onChange={view.mayApprove ? (next) => change(item.n, next) : undefined}
          />
        ))}
      </ul>
      {told !== undefined && <Alert tone="danger">{told.text}</Alert>}
      {told?.stale === true && <Button onClick={again}>{SEE_AGAIN}</Button>}
      {told?.decided === true && (
        <Link to="." search={{ aba: 'historico' }} className={buttonVariants()}>
          {TO_HISTORY}
        </Link>
      )}
      {view.mayApprove && choices.size > 0 && (
        <div className="sticky bottom-0 flex justify-end bg-canvas py-sm">
          <Button
            variant="primary"
            disabled={body === undefined || send.isPending}
            onClick={decide}
          >
            {send.isPending ? 'Decidindo…' : decideLabel(choices)}
          </Button>
        </div>
      )}
    </section>
  )
}

/**
 * **Para revisar**: the open proposals with each item, what it changes and its proof. Whoever
 * approves ticks, refuses with a reason and decides; anyone else reads who it waits for (web W34).
 */
export function Review({ companyId }: { companyId: CompanyId }) {
  const ontology = useQuery(ontologyQuery(companyId))
  const proposals = useQuery(openProposalsQuery(companyId))
  if (ontology.isError)
    return <ReadFailure text={sentenceOf(ontology.error)} onRetry={() => void ontology.refetch()} />
  if (proposals.isError)
    return (
      <ReadFailure text={sentenceOf(proposals.error)} onRetry={() => void proposals.refetch()} />
    )
  if (ontology.isPending || proposals.isPending) return <Waiting />
  if (proposals.data.proposals.length === 0) return <Empty>{NOTHING_TO_REVIEW}</Empty>
  const view = ontology.data
  return (
    <div className="flex flex-col gap-lg">
      {!view.mayApprove && view.awaits !== null && <p>{AWAITS[view.awaits]}</p>}
      {proposals.data.proposals.map((proposal) => (
        <ProposalBlock key={proposal.id} companyId={companyId} proposal={proposal} view={view} />
      ))}
    </div>
  )
}
