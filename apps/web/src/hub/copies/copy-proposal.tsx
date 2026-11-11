import type { CompanyId, CopyInterval, CopyProposalSummary } from '@conexus/hub-api'
import { COPY_INTERVAL_DEFAULT, CopyInterval as CopyIntervalSchema } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Badge } from '../../ui/badge.tsx'
import { Button } from '../../ui/button.tsx'
import { CodeBlock, CodeBlockContent, CodeBlockLine } from '../../ui/code-block.tsx'
import { Dialog, DialogContent } from '../../ui/dialog.tsx'
import { Row } from '../../ui/list.tsx'
import { ChoiceSelect } from '../../ui/select.tsx'
import { TableCell, TableRow } from '../../ui/table.tsx'
import { INTERVAL_CHOICES } from './interval.tsx'
import { sendCopyEnable, sendProposalDismiss } from './queries.ts'
import {
  enableFailureText,
  modeText,
  NO_SCHEDULE,
  PROPOSAL_WORD,
  provedText,
  UNCONFIRMED_ACTION,
} from './text.ts'

/** A copy's query in mono, a line at a time, scrolling inside its box (the detail and the dialog). */
export function QueryBlock({ query }: { query: string }) {
  return (
    <CodeBlock>
      <CodeBlockContent>
        {query
          .split('\n')
          .map((text, number) => ({ number, text }))
          .map((line) => (
            <CodeBlockLine key={line.number}>{line.text}</CodeBlockLine>
          ))}
      </CodeBlockContent>
    </CodeBlock>
  )
}

/** A refusal that closes the dialog: the proposal was decided elsewhere, and the list or the card reads it again. */
function decidedElsewhere(error: unknown) {
  return error instanceof HubFailure && error.code === 'COPY_PROPOSAL_DECIDED'
}

/**
 * **Ligar a proposta** (Capacidade 3): the query in mono, the key, the mode, the interval (30 minutes
 * marked) and the Projeto it is released to. The Cópias row and the conversation's card open this one
 * dialog, which calls `enableCopy` from the proposal; one request per attempt (web W24). A proposal
 * decided elsewhere closes it with the phrase, through `onRefused`; any other refusal stays inside.
 */
export function ProposalDialog(props: {
  companyId: CompanyId
  proposal: CopyProposalSummary
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefused: (text: string) => void
}) {
  const { companyId, proposal } = props
  const [chosen, setChosen] = useState<CopyInterval>(COPY_INTERVAL_DEFAULT)
  const [failure, setFailure] = useState<string>()
  const attempt = useAttemptKey()
  const enable = useMutation(sendCopyEnable)
  const sending = useRef(false)

  function onOpenChange(open: boolean) {
    if (!open) setFailure(undefined)
    props.onOpenChange(open)
  }

  async function turnOn() {
    if (sending.current) return
    sending.current = true
    const body = { from: 'PROPOSAL', proposalId: proposal.id, interval: chosen } as const
    try {
      await attempt((attemptKey) => enable.mutateAsync({ params: { companyId }, body, attemptKey }))
      onOpenChange(false)
    } catch (error) {
      if (decidedElsewhere(error)) {
        props.onRefused(sentenceOf(error))
        onOpenChange(false)
      } else setFailure(enableFailureText(error))
    } finally {
      sending.current = false
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Ligar a cópia ${proposal.name}`}
        description={`${proposal.label}, de ${proposal.connection.name}. O Conexus copia o dado para o banco da empresa e o atualiza no intervalo.`}
      >
        <div className="flex min-w-0 flex-col gap-md">
          <span className="text-text-2">Consulta</span>
          <QueryBlock query={proposal.shown.query} />
          <p className="break-words">
            <span className="text-text-2">Chave </span>
            <span className="font-mono text-fact">{proposal.shown.key.join(', ')}</span>
          </p>
          <p className="break-words">
            <span className="text-text-2">Modo </span>
            {modeText(proposal.mode)}
          </p>
          <ChoiceSelect
            label="Intervalo"
            value={chosen}
            items={INTERVAL_CHOICES}
            onValueChange={(next) => setChosen(CopyIntervalSchema.parse(next))}
          />
          <p className="break-words">{`Libera ao Projeto ${proposal.project.name}`}</p>
        </div>
        {failure !== undefined && <Alert tone="danger">{failure}</Alert>}
        <div className="flex flex-wrap gap-sm">
          <Button variant="primary" disabled={enable.isPending} onClick={() => void turnOn()}>
            {enable.isPending ? 'Ligando…' : 'Ligar'}
          </Button>
          <Button disabled={enable.isPending} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** **Ligar** and **Dispensar** of a proposal's row: the dialog, and the dismissal, one request at a time. */
function ProposalActions(props: {
  companyId: CompanyId
  proposal: CopyProposalSummary
  onRefused: (text: string) => void
}) {
  const { companyId, proposal } = props
  const [open, setOpen] = useState(false)
  const dismiss = useMutation(sendProposalDismiss)
  function dismissed() {
    if (dismiss.isPending) return
    dismiss.mutate(
      { params: { companyId, proposalId: proposal.id } },
      { onError: (error) => props.onRefused(writeFailureText(error, UNCONFIRMED_ACTION)) },
    )
  }
  return (
    <div className="flex flex-wrap gap-sm">
      <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
        Ligar
      </Button>
      <Button size="sm" disabled={dismiss.isPending} onClick={dismissed}>
        Dispensar
      </Button>
      <ProposalDialog
        companyId={companyId}
        proposal={proposal}
        open={open}
        onOpenChange={setOpen}
        onRefused={props.onRefused}
      />
    </div>
  )
}

type RowProps = {
  companyId: CompanyId
  proposal: CopyProposalSummary
  onRefused: (text: string) => void
  cell: string
}

/** A proposal in the table of copies: **Proposta** in words, who proposed it, its page of proof and its Projeto. */
export function ProposalTableRow({ companyId, proposal, onRefused, cell }: RowProps) {
  return (
    <TableRow>
      <TableCell className={`${cell} max-w-36 truncate`} title={proposal.connection.name}>
        {proposal.connection.name}
      </TableCell>
      <TableCell className={`${cell} whitespace-normal`}>
        <div className="flex flex-col">
          <span className="font-medium">{proposal.label}</span>
          <span className="text-text-2">{`${proposal.name} · ${modeText(proposal.mode)}`}</span>
        </div>
      </TableCell>
      <TableCell className={`${cell} whitespace-normal`}>
        <div className="flex flex-col items-start gap-xs">
          <Badge tone="neutral">{PROPOSAL_WORD}</Badge>
          <span className="text-text-2">{`por ${proposal.proposedBy.name}`}</span>
        </div>
      </TableCell>
      <TableCell className={cell}>{NO_SCHEDULE}</TableCell>
      <TableCell className={cell}>{NO_SCHEDULE}</TableCell>
      <TableCell className={`${cell} text-right tabular-nums`}>
        {provedText(proposal.proved)}
      </TableCell>
      <TableCell className={cell}>{NO_SCHEDULE}</TableCell>
      <TableCell className={`${cell} max-w-40 whitespace-normal`}>
        {proposal.project.name}
      </TableCell>
      <TableCell className={cell}>
        <ProposalActions companyId={companyId} proposal={proposal} onRefused={onRefused} />
      </TableCell>
    </TableRow>
  )
}

/** A proposal on a phone: the same facts in lines that break, as the copies' rows do. */
export function ProposalPhoneRow({ companyId, proposal, onRefused }: Omit<RowProps, 'cell'>) {
  return (
    <Row>
      <div className="flex min-w-0 flex-col gap-xs px-sm py-md">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-md">
          <span className="min-w-0 break-words">
            <span className="font-medium">{proposal.label}</span>
            <span className="text-text-2">{` · ${proposal.connection.name}`}</span>
          </span>
          <Badge tone="neutral">{PROPOSAL_WORD}</Badge>
        </div>
        <p className="break-words text-text-2">
          {`${proposal.name} · ${modeText(proposal.mode)} · por ${proposal.proposedBy.name}`}
        </p>
        <p className="break-words text-text-2 tabular-nums">
          {`${provedText(proposal.proved)} · ${proposal.project.name}`}
        </p>
        <ProposalActions companyId={companyId} proposal={proposal} onRefused={onRefused} />
      </div>
    </Row>
  )
}
