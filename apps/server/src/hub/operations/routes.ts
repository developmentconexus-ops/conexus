import {
  correctClient,
  deleteClient,
  getClient,
  listClients,
  registerClient,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { Clients } from './clients.ts'

/** The owner's invitation leaves after the commit: a refused one answers its failure, the rows stay. */
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
    if (made.mail !== undefined) {
      const { admitted, company } = made
      await identity.mailOwnerInvitation({ admitted, company, invitation: made.mail, signal })
    }
    return answer({ client: made.client })
  })

  serve(app, deleteClient, async ({ person, params, body, log }) => {
    await clients.remove({ person, ...params, ...body })
    log.info({ companyId: params.companyId, personId: person.id }, 'CLIENT_DELETED')
    return answer(undefined)
  })

  serve(app, correctClient, async ({ person, params, body, log }) => {
    const client = await clients.correct({ person, ...params, ...body })
    log.info({ companyId: client.companyId, personId: person.id }, 'CLIENT_CORRECTED')
    return answer({ client })
  })
}
