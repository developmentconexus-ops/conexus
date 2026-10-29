import type { TestContext } from 'node:test'
import { sankhyaFake } from '@conexus/connectors'
import type { Config } from '../../platform/config.ts'
import { parseSealKeys } from '../../platform/seal.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  hubWithLog,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'

/**
 * Empresa Teste on a Hub whose Sankhya is the kit's double on this machine: Ana its owner, Bruno an
 * administrator, Carla a member.
 */
export async function connectionsOn(t: TestContext) {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const hub = await hubWithLog(t, (config) => ({
    ...config,
    connectorOrigins: new Map([['sankhya', served.origin]]),
  }))
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const base = `/api/companies/${companyId}/connections`
  return { hub, fake, served, ana, bruno, carla, companyId, base }
}

export function linkSankhya(
  hub: Hub,
  person: Person,
  base: string,
  credential: Record<string, string>,
  key?: string,
) {
  return post(hub, person, base, { connector: 'sankhya', credential }, key)
}

/** Testar: a POST with no body. */
export function testOf(hub: Hub, person: Person, base: string, connectionId: string) {
  return hub.app.inject({
    method: 'POST',
    url: `${base}/${connectionId}/test`,
    headers: { origin: TEST_ORIGIN, cookie: person.cookie },
  })
}

/** A Hub's configuration change: it seals and opens with this key file's lines alone. */
export function sealingWith(...lines: string[]) {
  return (config: Config): Config => ({ ...config, sealKeys: parseSealKeys(lines.join('\n')) })
}
