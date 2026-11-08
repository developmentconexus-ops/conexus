import type { Company, PendingInvitation } from '@conexus/hub-api'
import { ROLE_LABELS } from '@conexus/hub-api'
import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { SendMail } from '../../platform/mail.ts'
import type { OperatorProof } from './admission.ts'
import { admit, admitAppUser, admitOperator, allows } from './admission.ts'
import type { ProjectApps } from './app-invitations.ts'
import { cancelAppInvitationsOf, openAppInvitations } from './app-invitations.ts'
import { createAuth, libraryCommandOn } from './auth.ts'
import {
  companyNameOf,
  deleteCompanyOn,
  markCompanyDeleting,
  markedDeleting,
  readOperatedCompanies,
  registerCompanyOn,
  renameCompanyOn,
} from './clients.ts'
import { registerCompanyRoutes } from './company-routes.ts'
import { createFirstPerson } from './first-person.ts'
import { mailInvitation } from './invitation-mail.ts'
import { lockCompany } from './invitations.ts'
import { createMayUse } from './may-use.ts'
import type { PersonConversationRelease } from './memberships.ts'
import { companyMembersOf, holdMember, membersAllowed, peopleNamed } from './memberships.ts'
import { companyNicknameOf } from './nickname.ts'
import { createPasswordRecovery } from './password-recovery.ts'
import type { RoleKit } from './roles.ts'
import { rolesFor } from './roles.ts'
import { registerIdentityRoutes } from './routes.ts'
import { addressOf, createSessionReader, liveHubSession, personNameOf } from './session.ts'

export type { ProjectApps } from './app-invitations.ts'
// The library's own configuration, for its tests: nothing routes to its sign-up, so only a direct
// call can prove the sign-up stays closed (criterion 18).
export { createAuth } from './auth.ts'
export type { Speaker } from './may-use.ts'
export { roleOfSpeaker } from './may-use.ts'
export type { PersonConversationRelease } from './memberships.ts'
export { passwordLinkText } from './messages.ts'
export type { RoleKit } from './roles.ts'
// The row policies' pieces, for the Central's own table and the Hub session's table, and a
// person's name, for the version that person sent, or a member's, for the request they decided.
// The tables themselves leave by `public-tables.ts`, for the foreign keys (code C8).
export { ADMINISTRATOR, memberNameColumn, personNameColumn, policy } from './tables.ts'
export type { OperatorProof }
export type Identity = ReturnType<typeof createIdentity>
export type IdentityPorts = Identity['ports']

/** The first owner's invitation, from Conexus, after the commit (step 4.1's E3). */
function ownerMailer(deps: { config: Config; database: Database; sendMail: SendMail }) {
  return (input: {
    admitted: OperatorProof
    company: Company
    invitation: PendingInvitation
    signal: AbortSignal
  }) =>
    mailInvitation(deps, {
      scope: {
        kind: 'OPERATOR',
        personId: input.admitted.personId,
        companyId: input.company.id,
      },
      invitation: input.invitation,
      gives: { kind: 'COMPANY', roleLabel: ROLE_LABELS.owner },
      companyName: input.company.name,
      inviter: { kind: 'CONEXUS', firstOwner: true },
      link: `${deps.config.publicOrigin}/invitations/${input.invitation.id}`,
      signal: input.signal,
    })
}

export function createIdentity(deps: {
  database: Database
  config: Config
  log: FailureLog
  sendMail: SendMail
  kit: RoleKit
}) {
  const { config, database, sendMail } = deps
  const roles = rolesFor(deps.kit)
  const auth = createAuth({ ...deps, roles })
  const libraryCommand = libraryCommandOn(auth, deps.database)
  const readSession = createSessionReader({ auth })
  const recovery = createPasswordRecovery({
    auth,
    database,
    publicOrigin: config.publicOrigin,
    sendMail,
  })
  return Object.freeze({
    readSession,
    firstPerson: createFirstPerson({ auth, database, publicOrigin: config.publicOrigin }),
    // What the Operations Central reaches identity through (code C4), in the caller's transaction.
    ports: Object.freeze({
      libraryCommand,
      lockCompany,
      admitMember: admit,
      allows,
      ...createMayUse(auth, deps.database, roles),
      // Who a request to publish tells, the members who decide it, and its asker held while it
      // is decided (step 24.3.4).
      membersAllowed,
      holdMember,
      // What a person's access to an app reaches identity through (step 18): the company being
      // deleted refuses them; the members, who use every app; names; the app's invitations.
      admitAppUser,
      companyMembersOf,
      peopleNamed,
      openAppInvitations,
      addressOf,
      cancelAppInvitations: cancelAppInvitationsOf(auth),
      admitOperator,
      registerCompany: registerCompanyOn(auth, roles),
      renameCompany: renameCompanyOn(auth),
      markCompanyDeleting,
      markedDeleting,
      companyNameOf,
      deleteCompany: deleteCompanyOn(auth),
      readOperatedCompanies,
      companyNicknameOf,
      liveHubSession,
      personNameOf,
      mailOwnerInvitation: ownerMailer(deps),
    }),
    // The Builder's release and the Projetos' apps come with the routes: identity exists before
    // either (code C4).
    routes: (
      app: Parameters<typeof registerIdentityRoutes>[0],
      later: { releaseConversations: PersonConversationRelease; apps: ProjectApps },
    ) => {
      registerIdentityRoutes(app, { auth, config: deps.config, readSession, recovery })
      registerCompanyRoutes(app, { ...deps, ...later, auth, libraryCommand, roles })
    },
  })
}
