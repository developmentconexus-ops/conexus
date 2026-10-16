import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { List, PageTitle, Row, rowBody, SectionTitle } from '../../ui/list.tsx'
import { Empty } from '../../ui/states.tsx'
import { InviteForm } from './invite-form.tsx'
import { Pager } from './pager.tsx'
import { companyQuery, invitationsQuery, membersQuery } from './queries.ts'
import { RoleBadge } from './role-badge.tsx'

const route = getRouteApi('/_app/companies/$companyId')

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
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{member.name}</span>
                <span className="truncate text-label text-text-2">{member.email}</span>
              </span>
              <RoleBadge role={member.role} />
            </div>
          </Row>
        ))}
      </List>
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
      <SectionTitle>Convites pendentes</SectionTitle>
      {data.invitations.length === 0 ? (
        <Empty>Nenhum convite pendente.</Empty>
      ) : (
        <List>
          {data.invitations.map((invitation) => (
            <Row key={invitation.id}>
              <div className={rowBody({ kind: 'wrapping' })}>
                <span className="min-w-0 truncate">{invitation.email}</span>
                <RoleBadge role={invitation.role} />
              </div>
            </Row>
          ))}
        </List>
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
