import type { CompanyId, Role } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { HubFailure } from '../../platform/hub.ts'
import { ActionDialog } from './member-actions.tsx'
import { deleteCompanyRole, everyInvitationQuery, everyMemberQuery } from './queries.ts'

const ASK_TO_CHANGE = 'Quem tem o papel precisa trocar antes.'
const ASK_TO_CANCEL = ' O convite aberto com ele precisa ser cancelado.'

/** Who still uses the role, read from the lists the Hub already gives: the people and the open invitations. */
function useWhoUses(companyId: CompanyId, role: Role) {
  const people = useQuery(everyMemberQuery(companyId))
  const invited = useQuery(everyInvitationQuery(companyId))
  return {
    names: (people.data ?? []).filter((one) => one.role === role),
    invitations: (invited.data ?? []).filter((one) => one.role === role),
  }
}

function WhoUses({ names, invitations }: ReturnType<typeof useWhoUses>) {
  return (
    <ul aria-label="Quem usa este papel" className="flex flex-col gap-xs">
      {names.map((one) => (
        <li key={one.personId} className="wrap-anywhere">
          {one.name} <span className="text-text-2">({one.email})</span>
        </li>
      ))}
      {invitations.map((one) => (
        <li key={one.id} className="wrap-anywhere">
          Convite para {one.email}
        </li>
      ))}
    </ul>
  )
}

/** "Apagar papel": the Hub refuses a role someone uses, and the dialog then says who. */
export function DeleteRole(props: {
  companyId: CompanyId
  role: Role
  label: string
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const send = useMutation(deleteCompanyRole)
  const inUse = send.error instanceof HubFailure && send.error.code === 'ROLE_IN_USE'
  const who = useWhoUses(props.companyId, props.role)
  function remove() {
    send.mutate(
      { params: { companyId: props.companyId, role: props.role } },
      {
        onSuccess: () => {
          setOpen(false)
          props.onDeleted()
        },
        onError: (error) => {
          if (error instanceof HubFailure && error.code === 'ROLE_NOT_FOUND') {
            setOpen(false)
            props.onDeleted()
          }
        },
      },
    )
  }
  return (
    <ActionDialog
      open={open}
      onOpenChange={setOpen}
      trigger={{ label: 'Apagar papel', name: `Apagar papel: ${props.label}`, danger: true }}
      title={`Apagar o papel ${props.label}?`}
      description={ASK_TO_CHANGE + (who.invitations.length > 0 ? ASK_TO_CANCEL : '')}
      confirm={{ label: 'Apagar papel', pending: 'Apagando…', disabled: inUse }}
      write={send}
      onConfirm={remove}
    >
      {inUse && <WhoUses {...who} />}
    </ActionDialog>
  )
}
