import {
  acceptInvitation,
  cancelInvitation,
  changeMemberRole,
  createInvitation,
  createInvitationPassword,
  declineInvitation,
  getCompany,
  getInvitation,
  listCompanies,
  listInvitations,
  listMembers,
  removeMember,
  renewInvitation,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import { answer, serve } from '../../platform/http.ts'
import type { SendMail } from '../../platform/mail.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { INVITATION_DECLINATION_PATH, INVITATION_PASSWORD_PATH } from './auth.ts'
import { readCompany, readMemberships } from './companies.ts'
import { deliveredOrRefused, mailInvitation } from './invitation-mail.ts'
import { cancelInvitationCommand, renewInvitationCommand } from './invitation-management.ts'
import { readInvitations, readReceived } from './invitation-reads.ts'
import { acceptCommand, declineCommand, passwordCommand } from './invitation-response.ts'
import { companyScope, createInvitationCommand } from './invitations.ts'
import { changeMemberRoleCommand, readMembers, removeMemberCommand } from './memberships.ts'
import { checkPassword } from './password-check.ts'
import { countInvitationAttempt } from './routes.ts'

type Deps = {
  auth: Auth
  libraryCommand: LibraryCommand
  database: Database
  config: Config
  sendMail: SendMail
}

function registerReads(app: FastifyInstance, { database }: Deps): void {
  serve(app, listCompanies, async ({ person, query }) =>
    answer(await readMemberships(database, person.id, query.page)),
  )

  serve(app, getCompany, async ({ person, params }) =>
    answer(await readCompany(database, { personId: person.id, ...params })),
  )

  serve(app, listMembers, async ({ person, params, query }) =>
    answer(await readMembers(database, { personId: person.id, ...params }, query.page)),
  )

  serve(app, listInvitations, async ({ person, params, query }) =>
    answer(await readInvitations(database, { personId: person.id, ...params }, query.page)),
  )

  serve(app, getInvitation, async ({ person, params }) =>
    answer({ invitation: await readReceived(database, person, params.invitationId) }),
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
      const { invitation } = made
      if (made.created) {
        log.info({ companyId: params.companyId }, 'INVITATION_CREATED')
      }
      const link = `${origin}/invitations/${invitation.id}`
      if (made.mail !== undefined) {
        const scope = companyScope({ person, ...params })
        const mail = { scope, invitation, ...made.mail, link, signal }
        deliveredOrRefused(await mailInvitation(deps, mail))
      }
      return answer({ invitation })
    },
  )

  serve(app, createInvitationPassword, async ({ person, params, body, headers, log }) => {
    await countInvitationAttempt(deps, { headers, log, path: INVITATION_PASSWORD_PATH })
    await checkPassword(body.password)
    const cookies = await password({ person, headers, ...params, ...body })
    log.info({}, 'INVITATION_PASSWORD_CREATED')
    return answer(undefined, cookies)
  })

  serve(app, declineInvitation, async ({ person, params, body, headers, log }) => {
    await countInvitationAttempt(deps, { headers, log, path: INVITATION_DECLINATION_PATH })
    const changed = await decline({ person, ...params, ...body })
    if (changed) log.info({}, 'INVITATION_DECLINED')
    return answer(undefined)
  })

  serve(app, acceptInvitation, async ({ person, sessionToken, headers, params, body, log }) => {
    const { company, accepted } = await accept({
      person,
      sessionToken,
      headers,
      ...params,
      ...body,
    })
    if (accepted) {
      const fields = {
        companyId: company.id,
        personId: person.id,
      }
      log.info(fields, 'INVITATION_ACCEPTED')
    }
    return answer({ company })
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
      deliveredOrRefused(await mailInvitation(deps, { scope, ...result, link, signal }))
      return answer({ invitation: result.invitation })
    },
  )
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
}

export function registerCompanyRoutes(app: FastifyInstance, deps: Deps): void {
  registerReads(app, deps)
  registerWrites(app, deps)
  registerManagement(app, deps)
  registerMemberships(app, deps)
}
