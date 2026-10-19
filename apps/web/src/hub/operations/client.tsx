import type { Client as ClientRecord } from '@conexus/hub-api'
import { FAILURES, OPERATOR_INVITES_AS } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { dayOf } from '../../platform/dates.ts'
import { Button } from '../../ui/button.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { CompanyPeople } from '../identity/public.ts'
import { maskedCnpj } from './cnpj.ts'
import { CorrectClientForm } from './correct-client-form.tsx'
import { DeleteClientDialog } from './delete-client-dialog.tsx'
import { FinishDeletion } from './finish-deletion.tsx'
import { OwnerInvitationSection } from './owner-invitation.tsx'
import { clientQuery } from './queries.ts'

const route = getRouteApi('/_app/operations/clients/$companyId')

const STATE_TEXT = {
  ACTIVE: 'Ativo',
  AWAITING_OWNER: 'Aguardando o administrador',
  DELETING: 'Exclusão em andamento',
} as const

function Data({ client }: { client: ClientRecord }) {
  const rows = [
    ['CNPJ', maskedCnpj(client.cnpj)],
    ['Razão social', client.legalName],
    ['Cadastrado em', dayOf(client.registeredAt)],
    ...(client.state.kind === 'ACTIVE' ? [['Ativo desde', dayOf(client.state.activeSince)]] : []),
  ]
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-lg gap-y-xs">
      {rows.map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="text-text-2">{term}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * A client of the Operations Central: its data, and either its administrator's invitation and the
 * correction while it awaits, or its people once active, whom the Central takes out and invites owners to (step 6); and its deletion (step 5).
 * Once active it also shows `kinds`, the account kinds the Central opens for the company (step 11).
 */
export function Client({ kinds }: { kinds?: ReactNode }) {
  const { companyId } = route.useParams()
  const { convite, ...pages } = route.useSearch()
  const { data } = useSuspenseQuery(clientQuery(companyId))
  const { client } = data
  const [correcting, setCorrecting] = useState(false)
  const { state } = client
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle className="break-words">{client.name}</PageTitle>
      <p className="text-label text-text-2">{STATE_TEXT[state.kind]}</p>
      {state.kind === 'AWAITING_OWNER' &&
        state.ownerInvitation.id === convite &&
        state.ownerInvitation.state === 'PENDING' && (
          <p role="status" className="text-text">
            {`Cliente cadastrado. ${FAILURES.MAIL_BOUNCED.phrase} Cancele o convite e use Convidar outro e-mail.`}
          </p>
        )}
      {correcting ? (
        <CorrectClientForm client={client} onDone={() => setCorrecting(false)} />
      ) : (
        <Data client={client} />
      )}
      {state.kind === 'AWAITING_OWNER' && !correcting && (
        <>
          <div>
            <Button onClick={() => setCorrecting(true)}>Corrigir dados</Button>
          </div>
          <OwnerInvitationSection companyId={companyId} invitation={state.ownerInvitation} />
        </>
      )}
      {state.kind === 'ACTIVE' && !correcting && (
        <CompanyPeople
          company={{ id: companyId, name: client.name }}
          pages={pages}
          mayInviteAs={OPERATOR_INVITES_AS}
        />
      )}
      {state.kind === 'ACTIVE' && !correcting && kinds}
      {state.kind === 'DELETING' && <FinishDeletion client={client} />}
      {!correcting && state.kind !== 'DELETING' && (
        <div>
          <DeleteClientDialog client={client} />
        </div>
      )}
    </div>
  )
}
