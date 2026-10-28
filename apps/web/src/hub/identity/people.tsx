import type { CompanyId, ListedInvitation, Role } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { keepsAttemptKey } from '../../platform/attempt-key.ts'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { SectionTitle } from '../../ui/list.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Empty } from '../../ui/states.tsx'
import { FramedTable, TableBody, TableCell, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
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

const route = getRouteApi('/_app/companies/$companyId_/settings/people')

function Lines({ main, under, role }: { main: string; under: string; role: Role }) {
  const phone = useIsMobile()
  return (
    <span className="flex flex-col gap-xs">
      <span className="wrap-anywhere">{main}</span>
      <span className="wrap-anywhere text-label text-text-2">{under}</span>
      {phone && <RoleBadge role={role} />}
    </span>
  )
}

const COLUMNS = [
  { name: 'Pessoa' },
  { name: 'Papel', leavesOnPhone: true, width: 'lg:w-36' },
  { name: 'Ações', width: 'lg:w-80' },
]

/** One list of the page as a table named by its section; on a phone the role moves under the name. The role and action columns have one width, so the two lists line up. */
function PeopleTable({ name, children }: { name: string; children: ReactNode }) {
  return (
    <FramedTable aria-label={name} columns={COLUMNS}>
      <TableBody>{children}</TableBody>
    </FramedTable>
  )
}

function Cells({
  name,
  under,
  role,
  children,
}: {
  name: string
  under: string
  role: Role
  children: ReactNode
}) {
  const phone = useIsMobile()
  return (
    <>
      <TableCell className="whitespace-normal px-sm">
        <Lines main={name} under={under} role={role} />
      </TableCell>
      {!phone && (
        <TableCell className="px-sm">
          <RoleBadge role={role} />
        </TableCell>
      )}
      <TableCell className="w-px px-sm text-right">
        <span className="flex items-center justify-end gap-sm max-md:flex-col max-md:items-stretch">
          {children}
        </span>
      </TableCell>
    </>
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
      <PeopleTable name="Pessoas">
        {data.members.map((member) => (
          <TableRow key={member.personId}>
            <Cells name={member.name} under={member.email} role={member.role}>
              <MemberActions
                companyId={company.id}
                companyName={company.name}
                member={member}
                self={member.personId === me}
              />
            </Cells>
          </TableRow>
        ))}
      </PeopleTable>
      <Pager next={data.next} param="members" page={page} list="Pessoas" />
    </section>
  )
}

/** Under the invitation's row: the cancellation's confirmation, or the refusal of the last send. */
function InvitationNote(props: {
  companyId: CompanyId
  invitation: ListedInvitation
  canceling: boolean
  error: unknown
  onClose: () => void
}) {
  const phone = useIsMobile()
  if (!props.canceling && props.error === null) return null
  return (
    <TableRow>
      <TableCell colSpan={phone ? 2 : 3} className="whitespace-normal px-sm py-sm">
        {props.canceling && (
          <CancelInvitationForm
            companyId={props.companyId}
            invitation={props.invitation}
            onClose={props.onClose}
          />
        )}
        {props.error !== null && (
          <p role="alert" className="text-label text-danger">
            {sentenceOf(props.error)}
          </p>
        )}
      </TableCell>
    </TableRow>
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

  const busy = send.isPending || renew.isPending || canceling
  return (
    <>
      <TableRow>
        <Cells
          name={invitation.email}
          under={
            invitation.state === 'PENDING'
              ? `Vence em ${dayAndHour(invitation.expiresAt)}`
              : 'Vencido'
          }
          role={invitation.role}
        >
          <Button
            size="sm"
            aria-label={`Reenviar convite para ${invitation.email}`}
            disabled={busy}
            onClick={inviteAgain}
          >
            {send.isPending || renew.isPending ? 'Enviando…' : 'Reenviar'}
          </Button>
          <Button
            size="sm"
            aria-label={`Cancelar convite para ${invitation.email}`}
            disabled={busy}
            onClick={() => setCanceling(true)}
          >
            Cancelar
          </Button>
        </Cells>
      </TableRow>
      <InvitationNote
        companyId={companyId}
        invitation={invitation}
        canceling={canceling}
        error={send.error ?? renew.error}
        onClose={() => setCanceling(false)}
      />
    </>
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
        <PeopleTable name="Convites pendentes">
          {data.invitations.map((invitation) => (
            <InvitationRow key={invitation.id} companyId={companyId} invitation={invitation} />
          ))}
        </PeopleTable>
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

/** "Pessoas e convites": a member reads the people and is told who invites (design V29). */
export function People() {
  const { companyId } = route.useParams()
  const pages = route.useSearch()
  const { data } = useSuspenseQuery(companyQuery(companyId))
  return (
    <div className="flex flex-col gap-xl">
      {data.mayInviteAs.length === 0 && (
        <p className="text-text-2">Só o dono ou um administrador convida pessoas.</p>
      )}
      <CompanyPeople company={data.company} pages={pages} mayInviteAs={data.mayInviteAs} />
    </div>
  )
}
