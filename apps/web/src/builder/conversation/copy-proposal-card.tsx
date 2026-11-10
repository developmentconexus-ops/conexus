import type { CompanyId } from '@conexus/hub-api'
import { CopyProposed } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import {
  MANAGERS_ENABLE,
  modeText,
  PROPOSAL_GONE,
  PROPOSAL_STATE,
  ProposalDialog,
  proposalsQuery,
  provedText,
} from '../../hub/copies/public.ts'
import { Alert } from '../../ui/alert.tsx'
import { Badge } from '../../ui/badge.tsx'
import { Button } from '../../ui/button.tsx'
import type { ToolItem } from './rows.ts'

const company = getRouteApi('/_app/companies/$companyId')

/** For whoever manages copies: the proposal as the Hub has it now, and **Ligar** while it is open. */
function LiveState(props: { companyId: CompanyId; proposed: CopyProposed }) {
  const { companyId, proposed } = props
  const read = useQuery(proposalsQuery(companyId, [proposed.proposalId]))
  const [open, setOpen] = useState(false)
  const [refused, setRefused] = useState<string>()
  // A reread that fails leaves the card as the tool left it.
  if (!read.isSuccess) return null
  const live = read.data.proposals.find((each) => each.id === proposed.proposalId)
  if (live === undefined) return <p className="text-text-2">{PROPOSAL_GONE}</p>
  return (
    <>
      {live.state === 'OPEN' ? (
        <Button variant="primary" onClick={() => setOpen(true)}>
          Ligar
        </Button>
      ) : (
        <Badge tone={live.state === 'ACCEPTED' ? 'success' : 'neutral'}>
          {PROPOSAL_STATE[live.state]}
        </Badge>
      )}
      {refused !== undefined && <Alert tone="danger">{refused}</Alert>}
      <ProposalDialog
        companyId={companyId}
        proposal={live}
        open={open}
        onOpenChange={(next) => {
          if (next) setRefused(undefined)
          setOpen(next)
        }}
        onRefused={setRefused}
      />
    </>
  )
}

/**
 * The card of a copy the Builder proposed (Capacidade 3, U3): drawn from the result of
 * `copy_propose` the conversation already holds, with the mode the Hub wrote. Whoever manages copies
 * rereads its state through the list of copies and turns it on in the Cópias page's own dialog; anyone
 * else reads who turns it on, with no button and no read the Hub would refuse (web W34). Dismissing is
 * the Cópias page's.
 */
export function CopyProposalCard({ tool }: { tool: Pick<ToolItem, 'result'> }) {
  const { companyId } = company.useParams()
  const { may } = company.useRouteContext()
  const parsed = CopyProposed.safeParse(tool.result)
  if (!parsed.success) return null
  const proposed = parsed.data
  return (
    <div className="flex flex-col items-start gap-sm rounded-card border border-line bg-surface p-md">
      <p className="font-display text-title break-words">{proposed.name}</p>
      <p className="break-words text-text-2">
        {`${proposed.connection.name} · ${modeText(proposed.mode)}`}
      </p>
      <p className="break-words">
        <span className="text-text-2">Chave </span>
        <span className="font-mono text-fact">{proposed.key.join(', ')}</span>
      </p>
      <p className="text-text-2 tabular-nums">{provedText(proposed)}</p>
      {may.manageCopies ? (
        <LiveState companyId={companyId} proposed={proposed} />
      ) : (
        <p className="text-text-2">{MANAGERS_ENABLE}</p>
      )}
    </div>
  )
}
