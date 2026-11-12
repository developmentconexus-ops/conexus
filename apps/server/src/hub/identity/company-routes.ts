import {
  acceptInvitation,
  cancelAppInvitation,
  cancelInvitation,
  changeMemberRole,
  createInvitation,
  createInvitationPassword,
  createRole,
  declineInvitation,
  deleteRole,
  getCompany,
  getInvitation,
  inviteToApp,
  listCompanies,
  listInvitations,
  listMembers,
  listRoles,
  removeMember,
  renewInvitation,
  setCompanyNickname,
  setMemberProfile,
  updateRole,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import { answer, serve } from '../../platform/http.ts'
import type { SendMail } from '../../platform/mail.ts'
import type { ProjectApps } from './app-invitations.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { INVITATION_DECLINATION_PATH, INVITATION_PASSWORD_PATH } from './auth.ts'
import { readCompany, readMemberships } from './companies.ts'
import {
  createRoleCommand,
  deleteRoleCommand,
  listRolesCommand,
  updateRoleCommand,
} from './company-roles.ts'
import { createInvitationCommand, inviteToAppCommand } from './invitation-create.ts'
import { deliveredOrRefused, mailInvitation } from './invitation-mail.ts'
import {
  cancelAppInvitationCommand,
  cancelInvitationCommand,
  renewInvitationCommand,
} from './invitation-management.ts'
import { readInvitations, readReceived } from './invitation-reads.ts'
import { acceptCommand, declineCommand, passwordCommand } from './invitation-response.ts'
import { appInvitationOf, companyScope, pendingOf } from './invitations.ts'
import { createMayUse } from './may-use.ts'
import { writeMemberProfile } from './member-profile.ts'
import type { PersonConversationRelease } from './memberships.ts'
import { changeMemberRoleCommand, readMembers, removeMemberCommand } from './memberships.ts'
import { chooseNickname } from './nickname.ts'
import { checkPassword } from './password-check.ts'
import type { RoleSet } from './roles.ts'
import { countAttempt } from './routes.ts'

type Deps = {
  auth: Auth
  libraryCommand: LibraryCommand
  database: Database
  config: Config
  sendMail: SendMail
  releaseConversations: PersonConversationRelease
  apps: ProjectApps
  roles: RoleSet
}

function registerReads(app: FastifyInstance, deps: Deps): void {
  const { database } = deps
  const mayUse = createMayUse(deps.auth, database, deps.roles)
  serve(app, listCompanies, async ({ person, query }) =>
    answer(await readMemberships(database, person.id, query.page)),
  )

  serve(app, getCompany, async ({ person, params }) => {
    const { appsDomain } = deps.config
    return answer(
      await readCompany(
        database,
        { personId: person.id, ...params, appsDomain },
        mayUse.mayPublishUnattended,
      ),
    )
  })

  serve(app, listMembers, async ({ person, params, query }) =>
    answer(await readMembers(database, { personId: person.id, ...params }, query.page)),
  )

  serve(app, listInvitations, async ({ person, params, query }) =>
    answer(await readInvitations(database, { personId: person.id, ...params }, query.page)),
  )

  serve(app, getInvitation, async ({ person, params }) =>
    answer({ invitation: await readReceived(deps, person, params.invitationId) }),
  )
}

/** The e-mail leaves after the commit: a refused one answers its failure, and the rows stay. */
function registerWrites(app: FastifyInstance, deps: Deps): void {
  const origin = deps.config.publicOrigin
  const invite = createInvitationCommand(deps)
  const password = passwordCommand(deps)
  const decline = declineCommand(deps)
  const accept = acceptCommand(deps)

  serve(
    app,
    createInvitation,
    async ({ person, headers, params, body, attemptKey, log, signal }) => {
      const made = await invite({ person, headers, ...params, ...body, attemptKey })
      const invitation = pendingOf(made.row)
      // The address's open app invitations give way to the company's, a member using every app.
      for (const projectId of made.canceled) {
        log.info({ companyId: params.companyId, projectId }, 'INVITATION_CANCELED')
      }
      if (made.created) {
        log.info({ companyId: params.companyId }, 'INVITATION_CREATED')
      }
      if (made.mail !== undefined) {
        const scope = companyScope({ person, ...params })
        const link = `${origin}/invitations/${invitation.id}`
        const mail = { scope, invitation: made.mail.sent, ...made.mail, link, signal }
        deliveredOrRefused(await mailInvitation(deps, mail))
      }
      return answer({ invitation })
    },
  )

  serve(app, createInvitationPassword, async ({ person, params, body, headers, log }) => {
    await countAttempt(deps, {
      headers,
      log,
      path: INVITATION_PASSWORD_PATH,
      exceeded: 'SIGN_IN_ATTEMPTS_EXCEEDED',
    })
    await checkPassword(body.password)
    const cookies = await password({ person, headers, ...params, ...body })
    log.info({}, 'INVITATION_PASSWORD_CREATED')
    return answer(undefined, cookies)
  })

  serve(app, declineInvitation, async ({ person, params, body, headers, log }) => {
    await countAttempt(deps, {
      headers,
      log,
      path: INVITATION_DECLINATION_PATH,
      exceeded: 'SIGN_IN_ATTEMPTS_EXCEEDED',
    })
    const changed = await decline({ person, ...params, ...body })
    if (changed) log.info({}, 'INVITATION_DECLINED')
    return answer(undefined)
  })

  serve(app, setCompanyNickname, async ({ person, params, body, log }) => {
    const { appsDomain } = deps.config
    const made = await chooseNickname(deps.database, { person, ...params, ...body, appsDomain })
    if (made.chosen) log.info({ companyId: params.companyId }, 'COMPANY_NICKNAME_CHOSEN')
    return answer({ company: made.company })
  })

  serve(app, acceptInvitation, async ({ person, sessionToken, headers, params, body, log }) => {
    const made = await accept({ person, sessionToken, headers, ...params, ...body })
    const { company } = made
    if (made.accepted) {
      const fields = { companyId: company.id, personId: person.id }
      if (made.projectId === null) log.info(fields, 'INVITATION_ACCEPTED')
      else log.info({ ...fields, projectId: made.projectId }, 'INVITATION_ACCEPTED')
    }
    return answer({ company, app: made.app })
  })
}

function registerManagement(app: FastifyInstance, deps: Deps): void {
  const cancel = cancelInvitationCommand(deps)
  const renew = renewInvitationCommand(deps)
  serve(app, cancelInvitation, async ({ person, sessionToken, headers, params, body, log }) => {
    if (await cancel({ person, sessionToken, headers, ...params, ...body }))
      log.info({ companyId: params.companyId }, 'INVITATION_CANCELED')
    return answer(undefined)
  })
  serve(
    app,
    renewInvitation,
    async ({ person, sessionToken, headers, params, body, signal, log }) => {
      const result = await renew({ person, sessionToken, headers, ...params, ...body })
      log.info({ companyId: params.companyId }, 'INVITATION_RENEWED')
      const link = `${deps.config.publicOrigin}/invitations/${result.invitation.id}`
      const scope = companyScope({ person, ...params })
      const gives = { kind: 'COMPANY', roleLabel: result.roleLabel } as const
      deliveredOrRefused(await mailInvitation(deps, { scope, ...result, gives, link, signal }))
      return answer({ invitation: result.invitation })
    },
  )
}

/** An invitation to use one app, the e-mail after the commit as for the company's (step 18, I). */
function registerAppInvitations(app: FastifyInstance, deps: Deps): void {
  const inviteApp = inviteToAppCommand(deps)
  const cancelApp = cancelAppInvitationCommand(deps)
  serve(app, inviteToApp, async ({ person, headers, params, body, attemptKey, log, signal }) => {
    const made = await inviteApp({ person, headers, ...params, ...body, attemptKey })
    const invitation = appInvitationOf(made.row)
    if (made.created) {
      log.info({ companyId: params.companyId, projectId: params.projectId }, 'INVITATION_CREATED')
    }
    if (made.mail !== undefined) {
      const scope = companyScope({ person, ...params })
      const link = `${deps.config.publicOrigin}/invitations/${invitation.id}`
      const mail = { scope, invitation: made.mail.sent, ...made.mail, link, signal }
      deliveredOrRefused(await mailInvitation(deps, mail))
    }
    return answer({ invitation })
  })

  serve(app, cancelAppInvitation, async ({ person, params, log }) => {
    if (await cancelApp({ person, ...params })) {
      log.info({ companyId: params.companyId, projectId: params.projectId }, 'INVITATION_CANCELED')
    }
    return answer(undefined)
  })
}

/** A change of people names who acted and on whom, by ids and the role, never by name (S41). */
function registerMemberships(app: FastifyInstance, deps: Deps): void {
  const remove = removeMemberCommand(deps)
  const change = changeMemberRoleCommand(deps)
  serve(app, removeMember, async ({ person, params, log }) => {
    const role = await remove({ person, ...params })
    if (role !== undefined) log.info({ ...params, by: person.id, role }, 'MEMBER_REMOVED')
    return answer(undefined)
  })
  serve(app, changeMemberRole, async ({ person, params, body, log }) => {
    const changed = await change({ person, ...params, ...body })
    const fields = { ...params, by: person.id, from: body.from, role: changed.role }
    if (body.role !== body.from) log.info(fields, 'MEMBER_ROLE_CHANGED')
    return answer({ member: changed })
  })
  serve(app, setMemberProfile, async ({ person, params, body, log }) => {
    const written = await writeMemberProfile(deps.database, { person, ...params, ...body })
    log.info({ ...params, by: person.id }, 'MEMBER_PROFILE_SET')
    return answer({ member: written })
  })
}

/** A role's change names who acted and on which role, never the operations it holds (S41). */
function registerRoles(app: FastifyInstance, deps: Deps): void {
  const list = listRolesCommand(deps)
  const create = createRoleCommand(deps)
  const update = updateRoleCommand(deps)
  const remove = deleteRoleCommand(deps)
  serve(app, listRoles, async ({ person, headers, params }) =>
    answer({ roles: await list({ person, headers, ...params }) }),
  )
  serve(app, createRole, async ({ person, headers, params, body, attemptKey, log }) => {
    const made = await create({ person, headers, ...params, body, attemptKey })
    if (made.created) log.info({ ...params, role: made.role.role, by: person.id }, 'ROLE_CREATED')
    return answer({ role: made.role })
  })
  serve(app, updateRole, async ({ person, headers, params, body, log }) => {
    const { role, ...company } = params
    const changed = await update({ person, headers, ...company, role, body })
    log.info(
      {
        ...params,
        by: person.id,
        added: changed.actions.added.join(),
        removed: changed.actions.removed.join(),
      },
      'ROLE_UPDATED',
    )
    return answer({ role: changed.role })
  })
  serve(app, deleteRole, async ({ person, headers, params, log }) => {
    await remove({ person, headers, log, ...params })
    log.info({ ...params, by: person.id }, 'ROLE_DELETED')
    return answer(undefined)
  })
}

export function registerCompanyRoutes(app: FastifyInstance, deps: Deps): void {
  registerReads(app, deps)
  registerWrites(app, deps)
  registerManagement(app, deps)
  registerAppInvitations(app, deps)
  registerMemberships(app, deps)
  registerRoles(app, deps)
}
