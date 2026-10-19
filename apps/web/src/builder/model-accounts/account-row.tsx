import type { CompanyId, ModelAccount } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { FieldError } from '../../ui/field.tsx'
import { Row, rowBody } from '../../ui/list.tsx'
import { AssignAccount, RemoveAccount } from './account-dialogs.tsx'
import { sendChange } from './queries.ts'
import { RenameForm } from './rename-form.tsx'
import type { Person } from './text.ts'
import { audienceText, originText, refusalText, stateText } from './text.ts'
import type { Move } from './use-move-feedback.ts'

/** What a row may do: the Hub's `mayManage` for the company's accounts, always for the person's own. */
export type Powers = {
  /** Renames, pauses and removes. */
  act: boolean
  /** Gives the account to people; the company's accounts only. */
  assign: boolean
}

type Movement = { up: boolean; down: boolean; busy: boolean; onMove: (move: Move) => void }

function PauseButton({ companyId, account }: { companyId: CompanyId; account: ModelAccount }) {
  const send = useMutation(sendChange)
  const pausing = account.state === 'ready'
  return (
    <>
      <Button
        aria-label={`${pausing ? 'Pausar' : 'Retomar'} ${account.label}`}
        disabled={send.isPending}
        onClick={() =>
          send.mutate({
            params: { companyId, accountId: account.id },
            body: { revision: account.revision, state: pausing ? 'paused' : 'ready' },
          })
        }
      >
        {pausing ? 'Pausar' : 'Retomar'}
      </Button>
      <FieldError className="basis-full">
        {send.isError ? refusalText(send.error) : undefined}
      </FieldError>
    </>
  )
}

/** "Subir" and "Descer" stand only where the account can move, so no button is disabled unexplained. */
function MoveButtons({ account, move }: { account: ModelAccount; move: Movement }) {
  return (
    <>
      {move.up && (
        <Button
          data-move={`${account.id}:up`}
          aria-label={`Subir ${account.label}`}
          disabled={move.busy}
          onClick={() => move.onMove('up')}
        >
          Subir
        </Button>
      )}
      {move.down && (
        <Button
          data-move={`${account.id}:down`}
          aria-label={`Descer ${account.label}`}
          disabled={move.busy}
          onClick={() => move.onMove('down')}
        >
          Descer
        </Button>
      )}
    </>
  )
}

type Props = {
  companyId: CompanyId
  account: ModelAccount
  providerName: string
  people: readonly Person[]
  powers: Powers
  /** Where the account can move in its queue; absent when the person cannot order it. */
  move: Movement | undefined
  onRemoved: () => void
}

function Actions({ props, onRename }: { props: Props; onRename: () => void }) {
  const { companyId, account, powers, move } = props
  return (
    <span className="flex flex-wrap items-center gap-md">
      {move && <MoveButtons account={account} move={move} />}
      {powers.act && (
        <>
          <Button data-rename="" aria-label={`Renomear ${account.label}`} onClick={onRename}>
            Renomear
          </Button>
          {account.state !== 'refused' && <PauseButton companyId={companyId} account={account} />}
        </>
      )}
      {powers.assign && (
        <AssignAccount companyId={companyId} account={account} people={props.people} />
      )}
      {powers.act && (
        <RemoveAccount
          companyId={companyId}
          account={account}
          providerName={props.providerName}
          onRemoved={props.onRemoved}
        />
      )}
    </span>
  )
}

/**
 * An account of a queue: its name, how it was linked, its state and for whom it is, and the actions
 * the person may take. A refused account is linked again, not resumed (design V29, V30).
 */
export function AccountRow(props: Props) {
  const { account } = props
  const [renaming, setRenaming] = useState(false)
  const row = useRef<HTMLDivElement>(null)
  const under = [originText(account), stateText(account)]
  if (account.owner === 'company') under.push(audienceText(account, props.people))

  function closeRename() {
    setRenaming(false)
    row.current?.querySelector<HTMLElement>('[data-rename]')?.focus()
  }

  return (
    <Row>
      <div ref={row} className={rowBody({ kind: 'wrapping' })}>
        <span className="flex min-w-0 flex-col">
          <span className="break-words">{account.label}</span>
          <span className="break-words text-label text-text-2">{under.join(' · ')}</span>
        </span>
        <Actions props={props} onRename={() => setRenaming(true)} />
        {renaming && (
          <RenameForm companyId={props.companyId} account={account} onClose={closeRename} />
        )}
      </div>
    </Row>
  )
}
