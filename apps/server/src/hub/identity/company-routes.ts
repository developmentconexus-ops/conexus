import {
  acceptInvitation,
  createCompany,
  createInvitation,
  createInvitationPassword,
  declineInvitation,
  getCompany,
  getInvitation,
  listCompanies,
  listInvitations,
  listMembers,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import { answer, serve } from '../../platform/http.ts'
import type { SendMail } from '../../platform/mail.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { INVITATION_DECLINATION_PATH, INVITATION_PASSWORD_PATH } from './auth.ts'
import { createCompanyCommand, readCompany, readMembers, readMemberships } from './companies.ts'
import { mailInvitation } from './invitation-mail.ts'
import { readInvitations, readReceived } from './invitation-reads.ts'
import { acceptCommand, declineCommand, passwordCommand } from './invitation-response.ts'
import { createInvitationCommand } from './invitations.ts'
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
  const create = createCompanyCommand(deps)
  const invite = createInvitationCommand(deps)
  const password = passwordCommand(deps)
  const decline = declineCommand(deps)
  const accept = acceptCommand(deps)

  serve(app, createCompany, async ({ person, headers, body, attemptKey, log }) => {
    const { company, created } = await create({ person, headers, name: body.name, attemptKey })
    if (created) log.info({ companyId: company.id, personId: person.id }, 'COMPANY_CREATED')
    return answer({ company })
  })

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
        const { companyName } = made.mail
        await mailInvitation(deps, {
          invitation,
          companyName,
          inviterName: person.name,
          link,
          signal,
        })
      }
      return answer({ invitation })
    },
  )

  serve(app, createInvitationPassword, async ({ person, params, body, headers, log }) => {
    await countInvitationAttempt(deps, { headers, log, path: INVITATION_PASSWORD_PATH })
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

export function registerCompanyRoutes(app: FastifyInstance, deps: Deps): void {
  registerReads(app, deps)
  registerWrites(app, deps)
}
