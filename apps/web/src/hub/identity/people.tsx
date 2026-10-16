import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Empty } from '../../ui/states.tsx'
import { InviteForm } from './invite-form.tsx'
import { Pager } from './pager.tsx'
import { companyQuery, invitationsQuery, membersQuery } from './queries.ts'
import { ROLE_LABELS } from './roles.ts'

const route = getRouteApi('/_app/companies/$companyId')

function Members() {
  const { companyId } = route.useParams()
  const { members: page } = route.useSearch()
  const { data } = useSuspenseQuery(membersQuery(companyId, page))
  return (
    <section className="flex flex-col gap-lg">
      <h2 className="font-display text-title">Pessoas</h2>
      <ul className="flex flex-col border-y border-line">
        {data.members.map((member) => (
          <li
            key={member.personId}
            className="flex flex-wrap items-center justify-between gap-x-md gap-y-xs border-b border-line px-sm py-md last:border-b-0"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{member.name}</span>
              <span className="truncate text-label text-text-2">{member.email}</span>
            </span>
            <span className="shrink-0 text-label text-text-2">{ROLE_LABELS[member.role]}</span>
          </li>
        ))}
      </ul>
      <Pager next={data.next} param="members" page={page} />
    </section>
  )
}

function PendingInvitations() {
  const { companyId } = route.useParams()
  const { invitations: page } = route.useSearch()
  const { data } = useSuspenseQuery(invitationsQuery(companyId, page))
  return (
    <section className="flex flex-col gap-lg">
      <h2 className="font-display text-title">Convites pendentes</h2>
      {data.invitations.length === 0 ? (
        <Empty>Nenhum convite pendente.</Empty>
      ) : (
        <ul className="flex flex-col border-y border-line">
          {data.invitations.map((invitation) => (
            <li
              key={invitation.id}
              className="flex flex-wrap items-center justify-between gap-x-md gap-y-xs border-b border-line px-sm py-md last:border-b-0"
            >
              <span className="min-w-0 truncate">{invitation.email}</span>
              <span className="shrink-0 text-label text-text-2">
                {ROLE_LABELS[invitation.role]}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Pager next={data.next} param="invitations" page={page} />
    </section>
  )
}

/** The company's name and people; for those the Hub lets invite, the open invitations and the form. */
export function People() {
  const { companyId } = route.useParams()
  const { data: company } = useSuspenseQuery(companyQuery(companyId))
  return (
    <div className="flex flex-col gap-xl">
      <h1 className="truncate font-display text-title">{company.company.name}</h1>
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
