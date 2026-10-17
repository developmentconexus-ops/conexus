import type { CompanyId, ListedInvitation, Role } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { keepsAttemptKey } from '../../platform/attempt-key.ts'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { List, PageTitle, Row, rowBody, SectionTitle } from '../../ui/list.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Empty } from '../../ui/states.tsx'
import { CancelInvitationForm } from './cancel-invitation-form.tsx'
import { InviteForm } from './invite-form.tsx'
import { MemberActions } from './member-actions.tsx'
import {
  companyQuery,
  invitationsQuery,
  inviteToCompany,
  membersQuery,
  renewCompanyInvitation,
  sessionQuery,
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

/** The pages of the two lists, kept in the address (web W18). */
export type PeoplePages = { members?: string | undefined; invitations?: string | undefined }
type Company = { id: CompanyId; name: string }

function Members({ company, page }: { company: Company; page: string | undefined }) {
  const { data } = useSuspenseQuery(membersQuery(company.id, page))
  const { data: session } = useSuspenseQuery(sessionQuery)
  const me = session.state === 'SIGNED_IN' ? session.person.id : undefined
  return (
    <section className="flex flex-col gap-lg">
      <SectionTitle>Pessoas</SectionTitle>
      <List>
        {data.members.map((member) => (
          <Row key={member.personId}>
            <div className={rowBody({ kind: 'wrapping' })}>
              <Lines main={member.name} under={member.email} />
              <span className="flex flex-wrap items-center gap-md">
                <RoleBadge role={member.role} />
                <MemberActions
                  companyId={company.id}
                  companyName={company.name}
                  member={member}
                  self={member.personId === me}
                />
              </span>
            </div>
          </Row>
        ))}
      </List>
      <Pager next={data.next} param="members" page={page} list="Pessoas" />
    </section>
  )
}

function InvitationRow({
  companyId,
  invitation,
}: {
  companyId: CompanyId
  invitation: ListedInvitation
}) {
  const send = useMutation(inviteToCompany)
  const renew = useMutation(renewCompanyInvitation)
  const [canceling, setCanceling] = useState(false)
  const attemptKey = useRef<string | undefined>(undefined)
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
    // The mutation owns the visible refusal; the key stays until the Hub settled an attempt.
    attemptKey.current ??= crypto.randomUUID()
    send.mutate(
      { params: { companyId }, body, attemptKey: attemptKey.current },
      {
        onSuccess: () => {
          attemptKey.current = undefined
        },
        onError: (error) => {
          if (!keepsAttemptKey(error)) attemptKey.current = undefined
        },
      },
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

function PendingInvitations({
  companyId,
  page,
}: {
  companyId: CompanyId
  page: string | undefined
}) {
  const { data } = useSuspenseQuery(invitationsQuery(companyId, page))
  return (
    <section className="flex flex-col gap-lg">
      <SectionTitle>Convites pendentes</SectionTitle>
      {data.invitations.length === 0 ? (
        <Empty>Nenhum convite pendente.</Empty>
      ) : (
        <List>
          {data.invitations.map((invitation) => (
            <InvitationRow key={invitation.id} companyId={companyId} invitation={invitation} />
          ))}
        </List>
      )}
      <Pager next={data.next} param="invitations" page={page} list="Convites pendentes" />
    </section>
  )
}

/**
 * A company's people, and for those the Hub lets invite, its open invitations and the form with the
 * roles on offer: the company's page and the Central's page of a client read it the same way.
 */
export function CompanyPeople(props: {
  company: Company
  pages: PeoplePages
  mayInviteAs: readonly Role[]
}) {
  const { company, pages, mayInviteAs } = props
  return (
    <>
      <Members company={company} page={pages.members} />
      {mayInviteAs.length > 0 && (
        <>
          <PendingInvitations companyId={company.id} page={pages.invitations} />
          <InviteForm companyId={company.id} roles={mayInviteAs} />
        </>
      )}
    </>
  )
}

/** The company's name and people. */
export function People() {
  const { companyId } = route.useParams()
  const pages = route.useSearch()
  const { data } = useSuspenseQuery(companyQuery(companyId))
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle className="truncate">{data.company.name}</PageTitle>
      <CompanyPeople company={data.company} pages={pages} mayInviteAs={data.mayInviteAs} />
    </div>
  )
}
