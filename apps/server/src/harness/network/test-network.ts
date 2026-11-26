import type { TestContext } from 'node:test'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  hubWithLog,
  memberOn,
  personOn,
  plantCompany,
} from '../../hub/identity/test-hub.ts'

export const DAVI = { name: 'Davi Moura', email: 'davi@example.test' }
export const EDU = { name: 'Edu Prado', email: 'edu@example.test' }

export async function networkCompany(t: TestContext) {
  const hub = await hubWithLog(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'developer')
  const davi = await memberOn(hub, companyId, DAVI, 'member')
  const path = `/api/companies/${companyId}/network/domains`
  function rows() {
    return hub.test.asOwner(
      `select domain, reason, granted_by from builder.company_network_domain
        where company_id = $1 order by domain`,
      [companyId],
    )
  }
  return { hub, ana, bruno, carla, davi, companyId, path, rows }
}
