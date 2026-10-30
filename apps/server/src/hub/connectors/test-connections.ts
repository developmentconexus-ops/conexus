import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import type { AppKeys } from '@conexus/connectors'
import { mercadoLivreFake, sankhyaFake } from '@conexus/connectors'
import { REDIRECT_PATH } from '@conexus/hub-api'
import { z } from 'zod'
import type { Config } from '../../platform/config.ts'
import { ConnectorApps } from '../../platform/config-connectors.ts'
import { parseSealKeys } from '../../platform/seal.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  hubWithLog,
  memberOn,
  PASSWORD,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'

/**
 * Empresa Teste on a Hub whose Sankhya is the kit's double on this machine: Ana its owner, Bruno an
 * administrator, Carla a member.
 */
export async function connectionsOn(
  t: TestContext,
  /** The origin the Hub is given for the double, when something stands in front of it. */
  through: (origin: string) => Promise<string> = async (origin) => origin,
) {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const origin = await through(served.origin)
  const hub = await hubWithLog(t, (config) => ({
    ...config,
    connectorOrigins: new Map([['sankhya', origin]]),
  }))
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const base = `/api/companies/${companyId}/connections`
  return { hub, fake, served, ana, bruno, carla, companyId, base }
}

/** The installation's apps file, as the configuration reads it, with the double's invented app. */
export function appsOf(app: AppKeys): Config['connectorApps'] {
  return ConnectorApps.parse(JSON.stringify({ 'mercado-livre': app }))
}

/**
 * Empresa Teste on a Hub whose Mercado Livre is the kit's double on this machine, sending the
 * person back to the Hub's return page, with the double's app keys: Ana its owner, Bruno an
 * administrator, Carla a member.
 */
export async function mercadoLivreOn(
  t: TestContext,
  a: {
    change?: (config: Config) => Config
    /** The origin the Hub is given for the double, when something stands in front of it. */
    through?: (origin: string) => Promise<string>
  } = {},
) {
  const fake = mercadoLivreFake({ redirectUri: `${TEST_ORIGIN}${REDIRECT_PATH}` })
  const served = await fake.serve()
  t.after(() => served.close())
  const origin = a.through === undefined ? served.origin : await a.through(served.origin)
  const change = a.change ?? ((config: Config) => config)
  const hub = await hubWithLog(t, (config) =>
    change({
      ...config,
      connectorOrigins: new Map([['mercado-livre', origin]]),
      connectorApps: appsOf(fake.app),
    }),
  )
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const base = `/api/companies/${companyId}/connections`
  return { hub, fake, served, ana, bruno, carla, companyId, base }
}

export function startOf(hub: Hub, person: Person, companyId: string, body: object) {
  return post(hub, person, `/api/companies/${companyId}/connection-sign-ins`, body)
}

/** The person at the double's authorization page: where it sends them back, read. */
export async function consentAt(url: string) {
  const page = await fetch(url, { redirect: 'manual' })
  const back = new URL(page.headers.get('location') ?? '')
  const state = back.searchParams.get('state') ?? ''
  return {
    back,
    code: back.searchParams.get('code'),
    error: back.searchParams.get('error'),
    signInId: state.split('.')[1] ?? '',
    companyId: state.split('.')[0] ?? '',
  }
}

export function completeOf(
  hub: Hub,
  person: Person,
  companyId: string,
  signInId: string,
  body: object,
) {
  return post(hub, person, `/api/companies/${companyId}/connection-sign-ins/${signInId}`, body)
}

/** Ligar on Mercado Livre all the way: start, the double's page, and the return with its code. */
export async function linkMercadoLivre(
  hub: Hub,
  person: Person,
  companyId: string,
  body: object = { connector: 'mercado-livre', name: 'Loja 1' },
) {
  const started = await startOf(hub, person, companyId, body)
  const back = await consentAt(Object(started.json()).url)
  return completeOf(hub, person, companyId, back.signInId, { code: back.code })
}

/** The kit's Sankhya double, served on this machine until the test ends. */
export async function servedSankhya(t: TestContext) {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  return { credential: fake.credential, origin: served.origin }
}

export function linkSankhya(
  hub: Hub,
  person: Person,
  base: string,
  credential: Record<string, string>,
  key?: string,
  name = 'Matriz',
) {
  return post(hub, person, base, { connector: 'sankhya', name, credential }, key)
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

/**
 * In front of a double: the token route answers as `mode.refresh` says, everything else passes;
 * every body the token route answers is kept in `mode.seen`, to look for its keys elsewhere.
 */
export function standIn(
  t: TestContext,
  mode: { refresh: 'pass' | 'unreadable' | 'down'; seen?: string[] },
) {
  return async (origin: string) => {
    const server = createServer(async (incoming, outgoing) => {
      const chunks: Buffer[] = []
      for await (const chunk of incoming) chunks.push(z.instanceof(Buffer).parse(chunk))
      if (incoming.url === '/oauth/token' && mode.refresh !== 'pass') {
        const [status, body] = mode.refresh === 'down' ? [503, '{}'] : [200, '{"token":"?"}']
        outgoing.writeHead(status, { 'content-type': 'application/json' }).end(body)
        return
      }
      const headers = Object.entries(incoming.headers).flatMap(([name, value]) =>
        typeof value === 'string' && name !== 'host'
          ? [[name, value] satisfies [string, string]]
          : [],
      )
      const answered = await fetch(`${origin}${incoming.url}`, {
        method: incoming.method,
        headers,
        redirect: 'manual',
        ...(incoming.method === 'GET' ? {} : { body: Buffer.concat(chunks) }),
      })
      const body = Buffer.from(await answered.arrayBuffer())
      if (incoming.url === '/oauth/token') mode.seen?.push(body.toString('utf8'))
      outgoing.writeHead(answered.status, Object.fromEntries(answered.headers))
      outgoing.end(body)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    t.after(() => {
      server.closeAllConnections()
      server.close()
    })
    const { port } = z.object({ port: z.number() }).parse(server.address())
    return `http://127.0.0.1:${port}`
  }
}

/** The apps file a spawned Hub reads, readable by its owner alone (S31). */
export function appsFileOf(t: TestContext, apps: Record<string, AppKeys>): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-apps-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, 'apps.json')
  writeFileSync(path, JSON.stringify(apps), { mode: 0o600 })
  return path
}

/** Ana signed in on a spawned Hub: her calls under the company, every body kept, and Ligar on Mercado Livre. */
export async function spawnedSession(port: number, companyId: string) {
  const origin = `http://127.0.0.1:${port}`
  const json = { origin: TEST_ORIGIN, 'content-type': 'application/json' }
  const signedIn = await fetch(`${origin}/api/sessions/current`, {
    method: 'PUT',
    headers: { ...json, 'cf-connecting-ip': '203.0.113.9' },
    body: JSON.stringify({ email: ANA_OWNER.email, password: PASSWORD }),
  })
  const cookie = (signedIn.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
  const bodies: string[] = []
  async function send(method: 'GET' | 'POST', path: string, body?: object) {
    const answered = await fetch(`${origin}/api/companies/${companyId}${path}`, {
      method,
      headers: body === undefined ? { origin: TEST_ORIGIN, cookie } : { ...json, cookie },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const text = await answered.text()
    bodies.push(text)
    return { status: answered.status, body: Object(text === '' ? null : JSON.parse(text)) }
  }
  async function link(body: object) {
    const started = await send('POST', '/connection-sign-ins', body)
    const back = await consentAt(started.body.url)
    const done = await send('POST', `/connection-sign-ins/${back.signInId}`, { code: back.code })
    return { ...done, code: back.code ?? '' }
  }
  return { send, link, bodies }
}
