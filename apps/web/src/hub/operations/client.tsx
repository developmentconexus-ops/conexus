import type { Client as ClientRecord } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { dayOf } from '../../platform/dates.ts'
import { Button } from '../../ui/button.tsx'
import { List, PageTitle, Row, rowBody, SectionTitle } from '../../ui/list.tsx'
import { maskedCnpj } from './cnpj.ts'
import { CorrectClientForm } from './correct-client-form.tsx'
import { OwnerInvitationSection } from './owner-invitation.tsx'
import { clientQuery } from './queries.ts'

const route = getRouteApi('/_app/operations/clients/$companyId')

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

function Owners({ owners }: { owners: { name: string; email: string }[] }) {
  return (
    <section className="flex flex-col gap-lg">
      <SectionTitle>Donos</SectionTitle>
      <List>
        {owners.map((owner) => (
          <Row key={owner.email}>
            <div className={rowBody({ kind: 'wrapping' })}>
              <span className="flex min-w-0 flex-col">
                <span className="break-words">{owner.name}</span>
                <span className="break-words text-label text-text-2">{owner.email}</span>
              </span>
            </div>
          </Row>
        ))}
      </List>
    </section>
  )
}

/**
 * A client of the Operations Central: its data, and either its administrator's invitation and the
 * correction while it awaits, or its owners once active, with no action (step 4.2, P7).
 */
export function Client() {
  const { companyId } = route.useParams()
  const { convite } = route.useSearch()
  const { data } = useSuspenseQuery(clientQuery(companyId))
  const { client } = data
  const [correcting, setCorrecting] = useState(false)
  const { state } = client
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle className="break-words">{client.name}</PageTitle>
      <p className="text-label text-text-2">
        {state.kind === 'ACTIVE' ? 'Ativo' : 'Aguardando o administrador'}
      </p>
      {state.kind === 'AWAITING_OWNER' &&
        state.ownerInvitation.id === convite &&
        state.ownerInvitation.state === 'PENDING' && (
          <p role="status" className="text-text">
            Cliente cadastrado. Esse endereço não recebe e-mails. Cancele o convite e use Convidar
            outro e-mail.
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
      {state.kind === 'ACTIVE' && <Owners owners={state.owners} />}
    </div>
  )
}
