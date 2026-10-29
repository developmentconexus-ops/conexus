import type { AppEntry, Person, PersonId } from '@conexus/hub-api'
import {
  CompanyId,
  InvitationId,
  InvitationView,
  ListedInvitation,
  PAGE_SIZE,
} from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { after, pageKey, pageOf } from '../../platform/pages.ts'
import { admitCompany, INSTALLATION_ADMINISTRATOR } from './admission.ts'
import type { ProjectApps } from './app-invitations.ts'
import { storedAddress } from './auth.ts'
import {
  CompanyPendingRow,
  LIVE,
  OF_COMPANY,
  PendingRow,
  pending,
  pendingOf,
  Status,
} from './invitations.ts'
import { CONEXUS } from './messages.ts'
import { account, company, invitation, member, user } from './tables.ts'

// "Convites pendentes" lists the company's own invitations; an app's shows in its Projeto's list.
const ListedRow = CompanyPendingRow.extend({ live: z.boolean() })
const ReceivedRow = PendingRow.and(
  z.object({
    live: z.boolean(),
    status: Status,
    companyId: CompanyId,
    companyName: z.string(),
    inviterName: z.string(),
    inviterIsOperator: z.boolean(),
    firstOwner: z.boolean(),
    hasPassword: z.boolean(),
    joined: z.boolean(),
    superseded: z.boolean(),
  }),
)
export function readInvitations(
  database: Database,
  input: { personId: PersonId; companyId: CompanyId },
  page: string | undefined,
) {
  return database.read({ kind: 'COMPANY', ...input }, async (tx) => {
    const admitted = await admitCompany({ tx, ...input, action: 'readInvitations' })
    const key = pageKey(page, InvitationId)
    const rows = await tx
      .select({ ...pending, live: sql<boolean>`${LIVE}` })
      .from(invitation)
      .where(
        and(
          eq(invitation.organizationId, admitted.companyId),
          eq(invitation.status, 'pending'),
          OF_COMPANY,
          after(sql`(${invitation.createdAt}, ${invitation.id})`, key, (id) =>
            tx
              .select({ createdAt: invitation.createdAt, id: invitation.id })
              .from(invitation)
              .where(and(eq(invitation.id, id), eq(invitation.organizationId, admitted.companyId))),
          ),
        ),
      )
      .orderBy(asc(invitation.createdAt), asc(invitation.id))
      .limit(PAGE_SIZE + 1)
    const parsed = rows.map((row) => ListedRow.parse(row))
    const listed = pageOf(parsed, (row) => row.id)
    return {
      invitations: listed.rows.map((row) =>
        ListedInvitation.parse({ ...pendingOf(row), state: stateOf('pending', row.live) }),
      ),
      next: listed.next,
    }
  })
}

export function stateOf(status: z.infer<typeof Status>, live: boolean) {
  switch (status) {
    case 'accepted':
      return 'ACCEPTED'
    case 'canceled':
      return 'CANCELED'
    case 'rejected':
      return 'DECLINED'
    case 'pending':
      return live ? 'PENDING' : 'EXPIRED'
    default:
      return status satisfies never
  }
}

type Received = z.infer<typeof ReceivedRow>
/** What the invitation gives: the company, or one of its apps, `gone` once its Projeto is. */
type Given = { joined: boolean; app: AppEntry | null; gone: boolean }

async function receivedRow(tx: ReadTx, person: Person | undefined, invitationId: InvitationId) {
  const [found] = await tx
    .select({
      ...pending,
      hasPassword: sql<boolean>`exists (select 1 from ${account}
        inner join ${user} on ${user.id} = ${account.userId}
        where lower(${user.email}) = lower(${invitation.email})
        and ${account.providerId} = 'credential' and ${account.password} is not null)`,
      joined: sql<boolean>`exists (select 1 from ${member}
        where ${member.organizationId} = ${invitation.organizationId}
        and ${member.userId} = ${person?.id ?? ''})`,
      status: invitation.status,
      superseded: sql<boolean>`${invitation.supersededAt} is not null`,
      live: sql<boolean>`${LIVE}`,
      companyId: company.id,
      companyName: company.name,
      inviterName: user.name,
      inviterIsOperator: sql<boolean>`coalesce(${user.role} = ${INSTALLATION_ADMINISTRATOR}, false)`,
      firstOwner: sql<boolean>`not exists (select 1 from ${member}
        where ${member.organizationId} = ${invitation.organizationId})`,
    })
    .from(invitation)
    .innerJoin(company, eq(invitation.organizationId, company.id))
    .innerJoin(user, eq(invitation.inviterId, user.id))
    .where(eq(invitation.id, invitationId))
  const row = ReceivedRow.optional().parse(found)
  if (row === undefined) throw new Failure('NOT_FOUND')
  return row
}

/** An app's invitation reads its Projeto, and whether the person uses the app, from Projects (C4). */
async function givenOf(
  apps: ProjectApps,
  tx: ReadTx,
  input: { row: Received; person: Person | undefined },
): Promise<Given> {
  const { row, person } = input
  if (row.kind === 'COMPANY') return { joined: row.joined, app: null, gone: false }
  const ids = { companyId: row.companyId, projectId: row.projectId }
  const joined = person !== undefined && (await apps.uses(tx, { ...ids, personId: person.id }))
  const opened = await apps.appOf(tx, ids)
  if (opened === undefined) return { joined, app: null, gone: true }
  return { joined, app: { ...opened, companyName: row.companyName }, gone: false }
}

function viewOf(row: Received, person: Person | undefined, given: Given) {
  const targetCompany = { id: row.companyId, name: row.companyName }
  if (row.status === 'accepted' && person !== undefined && given.joined) {
    return InvitationView.parse({ kind: 'JOINED', company: targetCompany, app: given.app })
  }
  const state = row.superseded ? 'EXPIRED' : stateOf(row.status, row.live)
  if (state !== 'PENDING') return InvitationView.parse({ kind: 'CLOSED', state })
  // The Projeto deleted or marked since the invitation: it gives nothing now (D17).
  if (given.gone) return InvitationView.parse({ kind: 'CLOSED', state: 'CANCELED' })
  const details = {
    company: targetCompany,
    role: row.kind === 'COMPANY' ? row.role : null,
    app: given.app === null ? null : { projectName: given.app.projectName },
    // The Operations Central invites as Conexus, where no one is a member yet and after (steps 4.2, 6).
    inviterName: row.inviterIsOperator ? CONEXUS : row.inviterName,
    firstOwner: row.firstOwner,
    expiresAt: row.expiresAt.toISOString(),
    revision: row.revision,
  }
  if (person !== undefined) return InvitationView.parse({ kind: 'INVITED', ...details })
  return InvitationView.parse({
    kind: row.hasPassword ? 'HAS_PASSWORD' : 'NEW',
    email: row.email,
    ...details,
  })
}

/**
 * The invitation its link names, as the person who opens it reads it: into the company, or to use
 * one of its apps, whose Projeto Projects reads (code C4).
 */
export function readReceived(
  deps: { database: Database; apps: ProjectApps },
  person: Person | undefined,
  invitationId: InvitationId,
) {
  const scope = { kind: 'INVITATION', invitationId, personId: person?.id ?? null } as const
  return deps.database.read(scope, async (tx) => {
    const row = await receivedRow(tx, person, invitationId)
    if (person !== undefined && row.email !== storedAddress(person.email)) {
      return InvitationView.parse({ kind: 'OTHER', signedInAs: person.email })
    }
    return viewOf(row, person, await givenOf(deps.apps, tx, { row, person }))
  })
}
