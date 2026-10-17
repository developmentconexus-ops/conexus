import { correctClient, getClient, listClients, registerClient } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { Clients } from './clients.ts'

/**
 * The owner's invitation leaves after the commit. A bounced address still answers the registered
 * client, so the operator lands on it and invites another e-mail; a provider that may not have sent
 * answers its failure, and a replay with the key sends again (code C37).
 */
export function registerClientRoutes(
  app: FastifyInstance,
  deps: { clients: Clients; identity: IdentityPorts },
): void {
  const { clients, identity } = deps

  serve(app, listClients, async ({ person, query }) =>
    answer(await clients.list(person, query.page)),
  )

  serve(app, getClient, async ({ person, params }) =>
    answer({ client: await clients.get(person, params.companyId) }),
  )

  serve(app, registerClient, async ({ person, body, attemptKey, log, signal }) => {
    const made = await clients.register({ person, ...body, attemptKey })
    if (made.created) {
      log.info({ companyId: made.client.companyId, personId: person.id }, 'CLIENT_REGISTERED')
    }
    let mailBounced = false
    if (made.mail !== undefined) {
      try {
        await identity.mailOwnerInvitation({ company: made.company, invitation: made.mail, signal })
      } catch (error) {
        if (!(error instanceof Failure && error.code === 'MAIL_BOUNCED')) throw error
        mailBounced = true
      }
    }
    return answer({ client: made.client, mailBounced })
  })

  serve(app, correctClient, async ({ person, params, body, log }) => {
    const client = await clients.correct({ person, ...params, ...body })
    log.info({ companyId: client.companyId, personId: person.id }, 'CLIENT_CORRECTED')
    return answer({ client })
  })
}
