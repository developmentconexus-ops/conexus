import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ATTEMPT_KEY_HEADER } from '@conexus/hub-api'
import example from '../../apps/edge/example/src/index.ts'
import { serveDispatch } from '../../apps/edge/src/dispatch.ts'
import { TEST_APPS_DOMAIN, TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import { liveHub, PASSWORD, personWithPassword } from './live-hub.ts'

// Step 8's journey without Cloudflare: the real Hub on both ports, the real dispatcher in Node,
// the namespace a fake that runs the example app. Cookies travel by hand, as a browser would
// carry them (testing T5, T6).
const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
const NICKNAME = 'acme'
const LABEL = `pedidos--${NICKNAME}`
// The dispatcher's wrangler vars type its domain as a literal, so the browser reaches it by that
// name; the Hub's own address for the Projeto (`apps.example.test`) is checked where it is made.
const EDGE_DOMAIN = 'conexusapp.tech'
const APP = `https://${LABEL}.${EDGE_DOMAIN}`
const HUB_ORIGIN = 'https://hub.conexus.fun'
const OWNER_IP = '198.51.100.10'
const MEMBER_IP = '203.0.113.10'

// The web's ban on the global `fetch` (web W9) is about the screens; a test is a client of the Hub.
const send = globalThis.fetch

type Reply = { status: number; headers: Headers; text: string }

/** The cookies a browser keeps for one host, changed by each answer's `Set-Cookie`. */
class Jar {
  cookies = new Map<string, string>()
  absorb(headers: Headers) {
    for (const line of headers.getSetCookie()) {
      const [pair = '', ...attributes] = line.split(';')
      const at = pair.indexOf('=')
      const name = pair.slice(0, at)
      const gone = pair.slice(at + 1) === '' || attributes.some((a) => a.trim() === 'Max-Age=0')
      if (gone) this.cookies.delete(name)
      else this.cookies.set(name, pair.slice(at + 1))
    }
  }
  header() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ')
  }
  copy() {
    const jar = new Jar()
    jar.cookies = new Map(this.cookies)
    return jar
  }
}

type Database = Parameters<typeof personWithPassword>[0]

/** Empresa A with Ana its owner and Carla a member, and no nickname yet. */
async function plantCompany(database: Database, owner: string, member: string) {
  const companyId = randomUUID().replaceAll('-', '')
  await database.asOwner(
    `insert into auth.company (id, name, slug, created_at, attempt_key, nickname)
      values ($1, 'Empresa A', $1, now(), $1, null)`,
    [companyId],
  )
  for (const [user, role] of [
    [owner, 'owner'],
    [member, 'member'],
  ]) {
    await database.asOwner(
      `insert into auth.member (id, company_id, user_id, role, created_at)
        values ($1, $2, $3, $4, now())`,
      [randomUUID().replaceAll('-', ''), companyId, user, role],
    )
  }
  return companyId
}

/** This journey sends no version, so no call reaches a version's `db`. */
const NO_VERSION = {
  Db(): never {
    throw new Error('no version is on the air in this journey')
  },
}

/** The dispatcher's bindings: the Hub's edge port, and a namespace that runs the example app. */
function edgeEnv(edgePort: number) {
  return {
    HUB_PUBLIC_ORIGIN: HUB_ORIGIN,
    APPS_DOMAIN: EDGE_DOMAIN,
    APP_LOGIN_KEY: 'k'.repeat(43),
    HUB: {
      async fetch(input: RequestInfo | URL, init?: RequestInit) {
        const url = new URL(new Request(input).url)
        return send(`http://127.0.0.1:${edgePort}${url.pathname}${url.search}`, init)
      },
      connect(): Socket {
        throw new Error('the dispatcher never opens a socket to the Hub')
      },
    },
    DISPATCHER: {
      get(name: string, args: { props: Parameters<typeof example.fetch>[2]['props'] }) {
        assert.equal(name, 'conexus-example')
        return {
          async fetch(request: Request) {
            return example.fetch(request, {}, args)
          },
          connect(): Socket {
            throw new Error('the example app opens no socket')
          },
        }
      },
    },
  } satisfies Env
}

async function scenario(t: TestContext) {
  const { port, edgePort, database } = await liveHub(t, 'http://127.0.0.1:9/unused')
  const ana = await personWithPassword(database, ANA)
  const carla = await personWithPassword(database, CARLA)
  const companyId = await plantCompany(database, ana, carla)
  const env = edgeEnv(edgePort)

  /** The Hub's public door as a person signed in; `as` is the person's cookie. */
  async function hub(method: string, path: string, who: Jar, body?: unknown, ip = OWNER_IP) {
    const headers: Record<string, string> = {
      origin: TEST_ORIGIN,
      'cf-connecting-ip': ip,
      [ATTEMPT_KEY_HEADER]: randomUUID(),
    }
    if (body !== undefined) headers['content-type'] = 'application/json'
    const cookie = who.header()
    if (cookie !== '') headers.cookie = cookie
    const response = await send(`http://127.0.0.1:${port}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    who.absorb(response.headers)
    const text = await response.text()
    return { status: response.status, headers: response.headers, text }
  }

  async function signedIn(email: string, ip: string) {
    const jar = new Jar()
    const reply = await hub('PUT', '/api/sessions/current', jar, { email, password: PASSWORD }, ip)
    assert.equal(reply.status, 200)
    return jar
  }

  /** One request of a browser to the app's host, through the dispatcher; redirects are not followed. */
  async function visit(jar: Jar, path: string): Promise<Reply> {
    const headers = new Headers()
    if (jar.header() !== '') headers.set('Cookie', jar.header())
    const response = await serveDispatch(
      new Request(`${APP}${path}`, { headers, redirect: 'manual' }),
      env,
      NO_VERSION,
    )
    jar.absorb(response.headers)
    return { status: response.status, headers: response.headers, text: await response.text() }
  }

  const sessions = {
    owner: await signedIn(ANA.email, OWNER_IP),
    member: await signedIn(CARLA.email, MEMBER_IP),
  }
  const nickname = await hub('PUT', `/api/companies/${companyId}/nickname`, sessions.owner, {
    nickname: NICKNAME,
  })
  assert.equal(nickname.status, 200)
  const made = await hub(
    'POST',
    `/api/companies/${companyId}/projects`,
    sessions.member,
    {
      name: 'Pedidos',
    },
    MEMBER_IP,
  )
  assert.equal(made.status, 201)
  assert.equal(JSON.parse(made.text).project.address, `${LABEL}.${TEST_APPS_DOMAIN}`)
  return { hub, visit, sessions, companyId, carla, project: JSON.parse(made.text).project.id }
}

type Scenario = Awaited<ReturnType<typeof scenario>>

/** First visit, the Hub's pass for this browser, the dispatcher's redemption: stops before the redeeming visit. */
async function getPass(s: Scenario, browser: Jar): Promise<string> {
  const first = await s.visit(browser, '/')
  assert.equal(first.status, 303)
  const open = new URL(first.headers.get('location') ?? '')
  assert.equal(open.origin, HUB_ORIGIN)
  assert.equal(open.pathname, '/apps/open')
  assert.equal(open.searchParams.get('host'), LABEL)
  assert.match(browser.header(), /^__Host-conexus-binding=[\w-]{43}$/)
  const handoff = await s.hub(
    'POST',
    '/api/apps/handoffs',
    s.sessions.member,
    { host: LABEL, binding: open.searchParams.get('binding') },
    MEMBER_IP,
  )
  assert.equal(handoff.status, 201)
  const { location } = JSON.parse(handoff.text)
  const hubSide = `https://${LABEL}.${TEST_APPS_DOMAIN}`
  assert.ok(location.startsWith(`${hubSide}/__conexus/passagem?code=`))
  return location.slice(hubSide.length)
}

async function enter(s: Scenario, browser: Jar) {
  const pass = await getPass(s, browser)
  const redeemed = await s.visit(browser, pass)
  assert.equal(redeemed.status, 303)
  assert.equal(redeemed.headers.get('location'), '/')
  assert.match(browser.header(), /^__Host-conexus-app=[\w-]{43}$/)
  return pass
}

test('app: a primeira visita passa pelo Hub e a página do app nomeia a pessoa e o Projeto', async (t) => {
  const s = await scenario(t)
  const browser = new Jar()
  await enter(s, browser)
  const page = await s.visit(browser, '/')
  assert.equal(page.status, 200)
  assert.match(page.text, /Olá, Carla Dias\. Este é o app do Projeto Pedidos\./)
  assert.match(page.headers.get('content-security-policy') ?? '', /^default-src 'none'/)
})

test('app: sem a pessoa na empresa o app diz que não há acesso, e o código usado não vale outra vez', async (t) => {
  const s = await scenario(t)
  const browser = new Jar()
  const replayer = new Jar()
  const pass = await enter(s, browser)
  const used = browser.copy()
  const early = await getPass(s, replayer)
  assert.equal((await s.visit(replayer, early)).status, 303)
  const stale = await s.visit(used, pass)
  assert.equal(stale.status, 403)
  const removed = await s.hub(
    'DELETE',
    `/api/companies/${s.companyId}/members/${s.carla}`,
    s.sessions.owner,
  )
  assert.equal(removed.status, 204)
  const refused = await s.visit(browser, '/')
  assert.equal(refused.status, 403)
  assert.match(refused.text, /Você não tem acesso a este app\./)
})

test('app: o Projeto apagado deixa o app sem existir', async (t) => {
  const s = await scenario(t)
  const browser = new Jar()
  await enter(s, browser)
  const gone = await s.hub(
    'DELETE',
    `/api/companies/${s.companyId}/projects/${s.project}`,
    s.sessions.owner,
    { name: 'Pedidos' },
  )
  assert.equal(gone.status, 204)
  const missing = await s.visit(browser, '/')
  assert.equal(missing.status, 404)
  assert.match(missing.text, /Este app não existe\./)
})
