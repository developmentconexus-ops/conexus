import type { CompanyId, ModelAccount, Owner, ProviderId } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { FieldError } from '../../ui/field.tsx'
import { TableBody, TableCell, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import type { Powers } from './account-menu.tsx'
import { AccountRow } from './account-row.tsx'
import { sendOrder } from './queries.ts'
import type { Person } from './text.ts'
import { refusalText } from './text.ts'
import type { Move } from './use-move-feedback.ts'
import { useMoveFeedback } from './use-move-feedback.ts'

type Props = {
  companyId: CompanyId
  owner: Owner
  provider: ProviderId
  providerName: string
  accounts: readonly ModelAccount[]
  people: readonly Person[]
  powers: Powers
  canOrder: boolean
  onRemoved: () => void
}

/**
 * One provider's queue of one owner, in the order the Hub holds. "Subir" and "Descer" send every id
 * of the queue in its new order; a queue that changed meanwhile answers 409 and the page reads again.
 */
export function Queue(props: Props) {
  const { accounts, providerName } = props
  const send = useMutation(sendOrder)
  const phone = useIsMobile()
  const feedback = useMoveFeedback(accounts, providerName, send.isPending)

  function move(index: number, direction: Move) {
    const ids = accounts.map((one) => one.id)
    const other = direction === 'up' ? index - 1 : index + 1
    const [id, neighbour] = [ids[index], ids[other]]
    if (id === undefined || neighbour === undefined) return
    ids[index] = neighbour
    ids[other] = id
    feedback.expect(id, direction)
    send.mutate(
      {
        params: { companyId: props.companyId, owner: props.owner, provider: props.provider },
        body: { ids },
      },
      { onError: feedback.forget },
    )
  }

  const ordering = props.canOrder && accounts.length > 1
  return (
    <TableBody ref={feedback.box}>
      <TableRow className="bg-surface-3 hover:bg-surface-3">
        <TableCell
          colSpan={phone ? 3 : 4}
          className="whitespace-normal px-sm py-sm text-label text-text-2"
        >
          <h3 className="inline font-medium text-text">{providerName}</h3>
          {` · ${accounts.length === 1 ? '1 conta' : `${accounts.length} contas`} · o Builder tenta nesta ordem`}
          <p role="status" className="sr-only">
            {feedback.said}
          </p>
          <FieldError>{send.isError ? refusalText(send.error) : undefined}</FieldError>
        </TableCell>
      </TableRow>
      {accounts.map((account, index) => (
        <AccountRow
          key={account.id}
          companyId={props.companyId}
          account={account}
          place={index + 1}
          providerName={providerName}
          people={props.people}
          powers={props.powers}
          move={
            ordering
              ? {
                  up: index > 0,
                  down: index < accounts.length - 1,
                  busy: send.isPending,
                  onMove: (direction) => move(index, direction),
                }
              : undefined
          }
          onRemoved={props.onRemoved}
        />
      ))}
    </TableBody>
  )
}
