import type { CompanyId, ModelAccount, PersonId } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { AlertDialogContentProps } from '../../ui/alert-dialog.tsx'
import { AccountDialog } from './account-dialog.tsx'
import { sendAssignees, sendRemoval } from './queries.ts'
import type { Person } from './text.ts'

/** A dialog the account's menu opens: the menu holds whether it is open. */
type Subject = {
  companyId: CompanyId
  account: ModelAccount
  open: boolean
  onOpenChange: (open: boolean) => void
  finalFocus: AlertDialogContentProps['finalFocus']
}

/** "Remover": the Hub forgets the credential, and the person is told to end it at the provider too. */
export function RemoveAccount(props: Subject & { providerName: string; onRemoved: () => void }) {
  const { companyId, account } = props
  const send = useMutation(sendRemoval)
  const advice =
    account.kind === 'api_key'
      ? ` Apague também a chave no Console da ${props.providerName}.`
      : ' A conta deixa de valer para o Conexus.'

  function remove() {
    send.mutate(
      { params: { companyId, accountId: account.id } },
      {
        onSuccess: () => {
          props.onOpenChange(false)
          props.onRemoved()
        },
      },
    )
  }

  return (
    <AccountDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      danger
      finalFocus={props.finalFocus}
      title={`Remover ${account.label}?`}
      description={`O Conexus apaga a credencial que guardou.${advice}`}
      confirm={{ label: 'Remover conta', pending: 'Removendo…' }}
      write={send}
      onConfirm={remove}
    />
  )
}

/** "Dar a pessoas": the list sent is the final one, and with nobody ticked the account is for all. */
export function AssignAccount(props: Subject & { people: readonly Person[] }) {
  const { companyId, account, people } = props
  const [picked, setPicked] = useState<readonly PersonId[]>(account.assignees)
  const send = useMutation(sendAssignees)

  function toggle(id: PersonId) {
    setPicked((now) => (now.includes(id) ? now.filter((one) => one !== id) : [...now, id]))
  }

  function changeOpen(next: boolean) {
    if (next) setPicked(account.assignees)
    props.onOpenChange(next)
  }

  function assign() {
    send.mutate(
      { params: { companyId, accountId: account.id }, body: { personIds: [...picked] } },
      { onSuccess: () => props.onOpenChange(false) },
    )
  }

  return (
    <AccountDialog
      open={props.open}
      onOpenChange={changeOpen}
      danger={false}
      finalFocus={props.finalFocus}
      title={`Dar ${account.label} a pessoas`}
      description="Sem ninguém marcada, a conta é para todos."
      confirm={{ label: 'Salvar', pending: 'Salvando…' }}
      write={send}
      onConfirm={assign}
    >
      <ul aria-label="Pessoas da empresa" className="flex flex-col gap-xs">
        {people.map((person) => (
          <li key={person.personId}>
            <label className="flex items-center gap-sm text-label">
              <input
                type="checkbox"
                checked={picked.includes(person.personId)}
                onChange={() => toggle(person.personId)}
              />
              {person.name}
            </label>
          </li>
        ))}
      </ul>
    </AccountDialog>
  )
}
