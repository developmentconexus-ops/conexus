import type { Company, PendingInvitation } from '@conexus/hub-api'
import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { SendMail } from '../../platform/mail.ts'
import type { OperatorProof } from './admission.ts'
import { admit, admitOperator, allows } from './admission.ts'
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
import { companyNicknameOf } from './nickname.ts'
import { createPasswordRecovery } from './password-recovery.ts'
import { registerIdentityRoutes } from './routes.ts'
import { createSessionReader, liveHubSession, personNameOf } from './session.ts'

// The library's own configuration, for its tests: nothing routes to its sign-up, so only a direct
// call can prove the sign-up stays closed (criterion 18).
export { createAuth } from './auth.ts'
export { passwordLinkText } from './messages.ts'
// The row policies' pieces, for the Central's own table, the Hub session's table, for the apps'
// foreign keys (code C8), and a person's name, for the version that person sent.
export { ADMINISTRATOR, personNameColumn, policy, session } from './tables.ts'
export type { OperatorProof }
export type Identity = ReturnType<typeof createIdentity>
export type IdentityPorts = Identity['ports']

export function createIdentity(deps: {
  database: Database
  config: Config
  log: FailureLog
  sendMail: SendMail
}) {
  const auth = createAuth(deps)
  const libraryCommand = libraryCommandOn(auth, deps.database)
  const readSession = createSessionReader({ auth })
  const recovery = createPasswordRecovery({
    auth,
    database: deps.database,
    publicOrigin: deps.config.publicOrigin,
    sendMail: deps.sendMail,
  })
  return Object.freeze({
    readSession,
    firstPerson: createFirstPerson({
      auth,
      database: deps.database,
      publicOrigin: deps.config.publicOrigin,
    }),
    // What the Operations Central reaches identity through (code C4), in the caller's transaction.
    ports: Object.freeze({
      libraryCommand,
      lockCompany,
      admitMember: admit,
      allows,
      admitOperator,
      registerCompany: registerCompanyOn(auth),
      renameCompany: renameCompanyOn(auth),
      markCompanyDeleting,
      markedDeleting,
      companyNameOf,
      deleteCompany: deleteCompanyOn(auth),
      readOperatedCompanies,
      companyNicknameOf,
      liveHubSession,
      personNameOf,
      /** The first owner's invitation, from Conexus, after the commit (step 4.1's E3). */
      mailOwnerInvitation: (input: {
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
          companyName: input.company.name,
          inviter: { kind: 'CONEXUS', firstOwner: true },
          link: `${deps.config.publicOrigin}/invitations/${input.invitation.id}`,
          signal: input.signal,
        }),
    }),
    routes: (app: Parameters<typeof registerIdentityRoutes>[0]) => {
      registerIdentityRoutes(app, { auth, config: deps.config, readSession, recovery })
      registerCompanyRoutes(app, { ...deps, auth, libraryCommand })
    },
  })
}
