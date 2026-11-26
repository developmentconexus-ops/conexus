import type { CompanyId, TreatmentModelId, VersionView } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { CodeBlock, CodeBlockContent, CodeBlockLine } from '../../ui/code-block.tsx'
import { useMay } from './may.ts'
import { sendApproval, useTreatedTables } from './queries.ts'
import {
  APPROVE,
  APPROVE_EFFECT,
  APPROVING,
  CANCEL,
  NOTHING_READ,
  PROPOSAL_CHANGED,
  READS,
  refText,
} from './text.ts'

/** The SQL of a version, read-only, line by line. */
export function Sql({ sql }: { sql: string }) {
  return (
    <CodeBlock>
      <CodeBlockContent>
        {[...sql.split('\n').entries()].map(([at, line]) => (
          <CodeBlockLine key={at}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  )
}

/** The tables a version reads, a treated one by its label, as De onde vem names it. */
export function Reads(props: { companyId: CompanyId; inputs: VersionView['inputs'] }) {
  const { inputs } = props
  const treated = useTreatedTables(props.companyId)
  function labelOf(table: string): string | null {
    const found = treated.data?.tables.find((one) => one.layer === 'tratado' && one.name === table)
    return found?.layer === 'tratado' ? found.label : null
  }
  if (inputs.length === 0) return <p className="text-text-2">{NOTHING_READ}</p>
  return (
    <ul className="flex flex-col gap-xs">
      {inputs.map((input) => (
        <li key={`${input.layer}.${input.table}`} className="font-mono text-fact">
          {refText(input, input.layer === 'tratado' ? labelOf(input.table) : null)}
        </li>
      ))}
    </ul>
  )
}

function titleOf(name: string, version: VersionView | null): string {
  return version === null ? `${APPROVE} ${name}?` : `${APPROVE} ${name} v${version.number}?`
}

/**
 * Ligar: the card with the SQL, the tables it reads and what happens after the yes. It sends the hash
 * of the version it showed; when someone else proposed since, the Hub refuses, and the card says
 * the proposal changed and shows the new one (the live `proposal`, read again after the refusal).
 */
export function Approve(props: {
  companyId: CompanyId
  modelId: TreatmentModelId
  name: string
  proposal: VersionView | null
}) {
  const { companyId, modelId, name } = props
  const may = useMay()
  const send = useMutation(sendApproval)
  const [opened, setOpened] = useState<VersionView | null>(null)
  const [asking, setAsking] = useState(false)
  const [changed, setChanged] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  if (!may.approveTreatment) return null
  const shown = changed ? props.proposal : opened

  function open() {
    setOpened(props.proposal)
    setChanged(false)
    setFailure(null)
    setAsking(true)
  }

  async function approve() {
    if (shown === null) return
    setFailure(null)
    try {
      await send.mutateAsync({
        params: { companyId, modelId, number: shown.number },
        body: { hash: shown.hash },
      })
      setAsking(false)
    } catch (error) {
      if (error instanceof HubFailure && error.code === 'TREATMENT_VERSION_CHANGED') {
        setChanged(true)
      } else setFailure(sentenceOf(error))
    }
  }

  return (
    <>
      <Button variant="primary" disabled={props.proposal === null} onClick={open}>
        {APPROVE}
      </Button>
      <AlertDialog open={asking} onOpenChange={(next) => next || setAsking(false)}>
        <AlertDialogContent
          title={titleOf(name, shown)}
          description={changed ? PROPOSAL_CHANGED : APPROVE_EFFECT}
        >
          {shown !== null && (
            <>
              <Sql sql={shown.sql} />
              <div className="flex flex-col gap-sm">
                <h3 className="font-medium">{READS}</h3>
                <Reads companyId={companyId} inputs={shown.inputs} />
              </div>
            </>
          )}
          {failure !== null && <Alert tone="danger">{failure}</Alert>}
          <div className="flex flex-wrap gap-md">
            <Button
              variant="primary"
              disabled={shown === null || send.isPending}
              onClick={() => void approve()}
            >
              {send.isPending ? APPROVING : APPROVE}
            </Button>
            <Button onClick={() => setAsking(false)}>{CANCEL}</Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
