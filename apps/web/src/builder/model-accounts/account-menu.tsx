import type { CompanyId, ModelAccount } from '@conexus/hub-api'
import { EllipsisIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { AssignAccount, RemoveAccount } from './account-dialogs.tsx'
import type { Person } from './text.ts'
import type { Move } from './use-move-feedback.ts'

/** What a row may do: the Hub's `mayManage` for the company's accounts, always for the person's own. */
export type Powers = {
  /** Renames, pauses and removes. */
  act: boolean
  /** Gives the account to people; the company's accounts only. */
  assign: boolean
}

export type Movement = { up: boolean; down: boolean; busy: boolean; onMove: (move: Move) => void }

/**
 * "Mais ações" of an account: rename, pause or resume, give to people and remove, in one menu
 * instead of a row of equal buttons. Remove sits last, apart, in danger text (design V55). The
 * dialogs open from their items, controlled by the menu (Base UI, "Open a dialog"). The pause is
 * the row's, so its refusal stays under the row when the menu closes.
 */
export function AccountMenu(props: {
  companyId: CompanyId
  account: ModelAccount
  providerName: string
  people: readonly Person[]
  powers: Powers
  /** On a phone the order moves into the menu. */
  move: Movement | undefined
  pause: { busy: boolean; onPause: () => void }
  onRename: () => void
  onRemoved: () => void
}) {
  const { companyId, account, powers, move, pause } = props
  const [dialog, setDialog] = useState<'assign' | 'remove' | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const removed = useRef(false)
  /** The "…" gets focus back, unless the removal took its row and the page took the focus. */
  function finalFocus() {
    return removed.current ? false : trigger.current
  }
  if (!powers.act && !powers.assign && !move) return null
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              ref={trigger}
              variant="ghost"
              size="icon-sm"
              aria-label={`Mais ações para ${account.label}`}
            />
          }
        >
          <EllipsisIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {move?.up && (
            <DropdownMenuItem disabled={move.busy} onClick={() => move.onMove('up')}>
              Subir
            </DropdownMenuItem>
          )}
          {move?.down && (
            <DropdownMenuItem disabled={move.busy} onClick={() => move.onMove('down')}>
              Descer
            </DropdownMenuItem>
          )}
          {powers.act && <DropdownMenuItem onClick={props.onRename}>Renomear</DropdownMenuItem>}
          {powers.act && account.state !== 'refused' && (
            <DropdownMenuItem disabled={pause.busy} onClick={pause.onPause}>
              {account.state === 'ready' ? 'Pausar' : 'Retomar'}
            </DropdownMenuItem>
          )}
          {powers.assign && (
            <DropdownMenuItem onClick={() => setDialog('assign')}>Dar a pessoas…</DropdownMenuItem>
          )}
          {powers.act && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-danger" onClick={() => setDialog('remove')}>
                Remover…
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {powers.assign && (
        <AssignAccount
          companyId={companyId}
          account={account}
          people={props.people}
          finalFocus={finalFocus}
          open={dialog === 'assign'}
          onOpenChange={(open) => setDialog(open ? 'assign' : null)}
        />
      )}
      {powers.act && (
        <RemoveAccount
          companyId={companyId}
          account={account}
          providerName={props.providerName}
          finalFocus={finalFocus}
          onRemoved={() => {
            removed.current = true
            props.onRemoved()
          }}
          open={dialog === 'remove'}
          onOpenChange={(open) => setDialog(open ? 'remove' : null)}
        />
      )}
    </>
  )
}
