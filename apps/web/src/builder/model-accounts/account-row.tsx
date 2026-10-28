import type { CompanyId, ModelAccount } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { Badge } from '../../ui/badge.tsx'
import { Button } from '../../ui/button.tsx'
import { FieldError } from '../../ui/field.tsx'
import { TableCell, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import type { Movement, Powers } from './account-menu.tsx'
import { AccountMenu } from './account-menu.tsx'
import { sendChange } from './queries.ts'
import { RenameForm } from './rename-form.tsx'
import type { Person } from './text.ts'
import { audienceText, originText, placeText, refusalText, stateText, stateTone } from './text.ts'

/** The arrows stand at both ends, the one that cannot move disabled, so the pair never shifts. */
function MoveButtons({ account, move }: { account: ModelAccount; move: Movement }) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        data-move={`${account.id}:up`}
        aria-label={`Subir ${account.label}`}
        disabled={move.busy || !move.up}
        onClick={() => move.onMove('up')}
      >
        <ArrowUpIcon aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        data-move={`${account.id}:down`}
        aria-label={`Descer ${account.label}`}
        disabled={move.busy || !move.down}
        onClick={() => move.onMove('down')}
      >
        <ArrowDownIcon aria-hidden="true" />
      </Button>
    </>
  )
}

type Props = {
  companyId: CompanyId
  account: ModelAccount
  /** Where it stands in its provider's queue, from 1. */
  place: number
  providerName: string
  people: readonly Person[]
  powers: Powers
  /** Where the account can move in its queue; absent when the person cannot order it. */
  move: Movement | undefined
  onRemoved: () => void
}

/**
 * An account of a queue as a table row: its place, its name with how it was linked, its state in
 * words and, if reserved, for whom, then the order and the menu with the rest. A refused account is
 * linked again, not resumed (design V29, V30, V35). The pause is sent from here, so a refusal is
 * said under the row whatever the menu does.
 */
export function AccountRow(props: Props) {
  const { account, move } = props
  const [renaming, setRenaming] = useState(false)
  const phone = useIsMobile()
  const actions = useRef<HTMLTableCellElement>(null)
  const send = useMutation(sendChange)
  const reserved = account.owner === 'company' && account.assignees.length > 0

  function closeRename() {
    setRenaming(false)
    actions.current?.querySelector<HTMLElement>('button[aria-haspopup]')?.focus()
  }

  return (
    <>
      <TableRow>
        <TableCell className="w-10 px-sm font-mono text-fact text-text-2">
          {placeText(props.place)}
        </TableCell>
        <TableCell className="whitespace-normal px-sm">
          <span className="flex flex-wrap items-baseline gap-x-sm gap-y-xs">
            <span className="wrap-anywhere font-medium">{account.label}</span>
            <span className="wrap-anywhere font-mono text-fact text-text-2">
              {originText(account)}
              {reserved && ` · ${audienceText(account, props.people)}`}
            </span>
            {phone && (
              <span className="basis-full">
                <Badge tone={stateTone(account)}>{stateText(account)}</Badge>
              </span>
            )}
          </span>
        </TableCell>
        {!phone && (
          <TableCell className="px-sm">
            <Badge tone={stateTone(account)}>{stateText(account)}</Badge>
          </TableCell>
        )}
        <TableCell ref={actions} className="w-px px-sm text-right">
          <span className="flex items-center justify-end">
            {move && !phone && <MoveButtons account={account} move={move} />}
            <AccountMenu
              companyId={props.companyId}
              account={account}
              providerName={props.providerName}
              people={props.people}
              powers={props.powers}
              move={phone ? move : undefined}
              pause={{
                busy: send.isPending,
                onPause: () =>
                  send.mutate({
                    params: { companyId: props.companyId, accountId: account.id },
                    body: {
                      revision: account.revision,
                      state: account.state === 'ready' ? 'paused' : 'ready',
                    },
                  }),
              }}
              onRename={() => setRenaming(true)}
              onRemoved={props.onRemoved}
            />
          </span>
        </TableCell>
      </TableRow>
      {(renaming || send.isError) && (
        <TableRow>
          <TableCell colSpan={phone ? 3 : 4} className="whitespace-normal px-sm py-sm">
            {renaming && (
              <RenameForm companyId={props.companyId} account={account} onClose={closeRename} />
            )}
            <FieldError>{send.isError ? refusalText(send.error) : undefined}</FieldError>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
