import type { CompanyId, ModelAccount, Owner, ProviderId } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { FieldError } from '../../ui/field.tsx'
import { List } from '../../ui/list.tsx'
import type { Powers } from './account-row.tsx'
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
  const feedback = useMoveFeedback(accounts, providerName)

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
    <div ref={feedback.box} className="flex flex-col gap-sm">
      <h3 className="text-body text-text-2">{providerName}</h3>
      <List>
        {accounts.map((account, index) => (
          <AccountRow
            key={account.id}
            companyId={props.companyId}
            account={account}
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
      </List>
      <p role="status" className="sr-only">
        {feedback.said}
      </p>
      <FieldError>{send.isError ? refusalText(send.error) : undefined}</FieldError>
    </div>
  )
}
