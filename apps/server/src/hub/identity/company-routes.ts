import {
  acceptInvitation,
  createCompany,
  createInvitation,
  getCompany,
  getInvitation,
  listCompanies,
  listInvitations,
  listMembers,
  putPasswordLink,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import { answer, serve } from '../../platform/http.ts'
import type { SendMail } from '../../platform/mail.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { createCompanyCommand, readCompany, readMembers, readMemberships } from './companies.ts'
import { mailInvitation } from './invitation-mail.ts'
import { readInvitations, readReceived } from './invitation-reads.ts'
import { acceptCommand, createInvitationCommand, passwordLinkCommand } from './invitations.ts'
import { passwordLinkMail } from './messages.ts'

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
  const giveLink = passwordLinkCommand(deps)
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
        log.info({ invitationId: invitation.id, companyId: params.companyId }, 'INVITATION_CREATED')
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

  serve(app, putPasswordLink, async ({ params, body, log, signal }) => {
    const given = await giveLink({ ...params, name: body.name })
    if (given.kind === 'LINK') {
      log.info({ invitationId: params.invitationId }, 'PASSWORD_LINK_GIVEN')
      const page = `/set-password?redirect=/invitations/${params.invitationId}`
      const link = `${origin}${page}#token=${given.token}`
      await deps.sendMail(passwordLinkMail({ to: given.email, name: given.name, link }), signal)
    }
    return answer(undefined)
  })

  serve(app, acceptInvitation, async ({ person, headers, params, log }) => {
    const { company, accepted } = await accept({ person, headers, ...params })
    if (accepted) {
      const fields = {
        invitationId: params.invitationId,
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
