import {
  addNetworkDomain,
  listNetworkDomains,
  NetworkDomain,
  removeNetworkDomain,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { CompanyList } from './store.ts'

export function registerNetworkRoutes(app: FastifyInstance, store: CompanyList): void {
  serve(app, listNetworkDomains, async ({ person, params }) =>
    answer({ domains: await store.list({ ...params, personId: person.id }) }),
  )

  serve(app, addNetworkDomain, async ({ person, params, body }) => {
    const domain = NetworkDomain.safeParse(body.domain)
    if (!domain.success) throw new Failure('NETWORK_DOMAIN_INVALID')
    const who = { ...params, personId: person.id }
    return answer(await store.add(who, { domain: domain.data, reason: body.reason }))
  })

  serve(app, removeNetworkDomain, async ({ person, params }) => {
    const who = { companyId: params.companyId, personId: person.id }
    await store.remove(who, params.domainId)
    return answer(undefined)
  })
}
