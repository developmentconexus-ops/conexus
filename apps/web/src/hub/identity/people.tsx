import type { ListedInvitation } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { List, PageTitle, Row, rowBody, SectionTitle } from '../../ui/list.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Empty } from '../../ui/states.tsx'
import { CancelInvitationForm } from './cancel-invitation-form.tsx'
import { InviteForm } from './invite-form.tsx'
import {
  companyQuery,
  invitationsQuery,
  inviteToCompany,
  membersQuery,
  renewCompanyInvitation,
} from './queries.ts'
import { RoleBadge } from './role-badge.tsx'

const route = getRouteApi('/_app/companies/$companyId')

function Lines({ main, under }: { main: string; under: string }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate">{main}</span>
      <span className="truncate text-label text-text-2">{under}</span>
    </span>
  )
}

function Members() {
  const { companyId } = route.useParams()
  const { members: page } = route.useSearch()
  const { data } = useSuspenseQuery(membersQuery(companyId, page))
  return (
    <section className="flex flex-col gap-lg">
      <SectionTitle>Pessoas</SectionTitle>
      <List>
        {data.members.map((member) => (
          <Row key={member.personId}>
            <div className={rowBody({ kind: 'wrapping' })}>
              <Lines main={member.name} under={member.email} />
              <RoleBadge role={member.role} />
            </div>
          </Row>
        ))}
      </List>
      <Pager next={data.next} param="members" page={page} list="Pessoas" />
    </section>
  )
}

function InvitationRow({ invitation }: { invitation: ListedInvitation }) {
  const { companyId } = route.useParams()
  const send = useMutation(inviteToCompany)
  const renew = useMutation(renewCompanyInvitation)
  const [canceling, setCanceling] = useState(false)
  const attempt = useAttemptKey()
  const body = {
    email: invitation.email,
    role: invitation.role,
    replaces: { id: invitation.id, revision: invitation.revision },
  }

  function inviteAgain() {
    if (invitation.state === 'PENDING') {
      renew.mutate({
        params: { companyId, invitationId: invitation.id },
        body: { revision: invitation.revision },
      })
      return
    }
    // The mutation owns the visible refusal.
    attempt((attemptKey) => send.mutateAsync({ params: { companyId }, body, attemptKey })).catch(
      () => undefined,
    )
  }

  return (
    <Row>
      <div className={rowBody({ kind: 'wrapping' })}>
        <Lines
          main={invitation.email}
          under={
            invitation.state === 'PENDING'
              ? `Vence em ${dayAndHour(invitation.expiresAt)}`
              : 'Vencido'
          }
        />
        <span className="flex flex-wrap items-center gap-md">
          <RoleBadge role={invitation.role} />
          <Button
            aria-label={`Reenviar convite para ${invitation.email}`}
            disabled={send.isPending || renew.isPending || canceling}
            onClick={inviteAgain}
          >
            {send.isPending || renew.isPending ? 'Enviando…' : 'Reenviar'}
          </Button>
          <Button
            aria-label={`Cancelar convite para ${invitation.email}`}
            disabled={send.isPending || renew.isPending || canceling}
            onClick={() => setCanceling(true)}
          >
            Cancelar
          </Button>
        </span>
        {canceling && (
          <CancelInvitationForm
            companyId={companyId}
            invitation={invitation}
            onClose={() => setCanceling(false)}
          />
        )}
        {(send.isError || renew.isError) && (
          <p role="alert" className="basis-full text-label text-danger">
            {sentenceOf(send.error ?? renew.error)}
          </p>
        )}
      </div>
    </Row>
  )
}

function PendingInvitations() {
  const { companyId } = route.useParams()
  const { invitations: page } = route.useSearch()
  const { data } = useSuspenseQuery(invitationsQuery(companyId, page))
  return (
    <section className="flex flex-col gap-lg">
      <SectionTitle>Convites pendentes</SectionTitle>
      {data.invitations.length === 0 ? (
        <Empty>Nenhum convite pendente.</Empty>
      ) : (
        <List>
          {data.invitations.map((invitation) => (
            <InvitationRow key={invitation.id} invitation={invitation} />
          ))}
        </List>
      )}
      <Pager next={data.next} param="invitations" page={page} list="Convites pendentes" />
    </section>
  )
}

/** The company's name and people; for those the Hub lets invite, the open invitations and the form. */
export function People() {
  const { companyId } = route.useParams()
  const { data: company } = useSuspenseQuery(companyQuery(companyId))
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle className="truncate">{company.company.name}</PageTitle>
      <Members />
      {company.mayInviteAs.length > 0 && (
        <>
          <PendingInvitations />
          <InviteForm />
        </>
      )}
    </div>
  )
}
