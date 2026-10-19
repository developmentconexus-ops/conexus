import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { ATTEMPT_KEY_HEADER } from '@conexus/hub-api'
import { hashPassword } from 'better-auth/crypto'
import { createEdgeHub, createHub, identityOf, subjectsOf } from '../../main.ts'
import type { Config } from '../../platform/config.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { heldCompanyPostgres, testAppPorts } from '../../platform/test-app-ports.ts'
import { fakeCloudflare } from '../../platform/test-cloudflare.ts'
import type { TestDatabase } from '../../platform/test-database.ts'
import {
  createTestDatabase,
  silent,
  TEST_ORIGIN,
  testConfig,
  testWebRoot,
  WRITE_HEADERS,
} from '../../platform/test-database.ts'
import { fakeNeon } from '../../platform/test-neon.ts'
import { createStatus } from '../status/public.ts'

export type Mail = {
  to: string
  subject: string
  text: string
  html: string
  from: { address: string; name: string }
}
type MailMode = 'DELIVER' | 'BOUNCE' | 'FAIL' | 'HOLD'

/**
 * A fake of the mail provider (T15): it keeps each message and answers as `mode` says. HOLD keeps
 * nothing and never answers, and `held` resolves when such a request has arrived.
 */
export async function mailServer(t: TestContext) {
  const sent: Mail[] = []
  const state: { mode: MailMode } = { mode: 'DELIVER' }
  const held = Promise.withResolvers<void>()
  const heldReplies: (() => void)[] = []
  function keep({ to, subject, text, html, from }: Mail) {
    sent.push({ to, subject, text, html, from })
  }
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (state.mode === 'HOLD') {
        heldReplies.push(() => {
          keep(body)
          const result = { delivered: [body.to], permanent_bounces: [], queued: [] }
          response.writeHead(200, { 'content-type': 'application/json' })
          response.end(JSON.stringify({ success: true, result }))
        })
        return held.resolve()
      }
      if (state.mode === 'FAIL') return response.writeHead(500).end()
      keep(body)
      const bounced = state.mode === 'BOUNCE' ? [body.to] : []
      const delivered = state.mode === 'DELIVER' ? [body.to] : []
      const result = { delivered, permanent_bounces: bounced, queued: [] }
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ success: true, result }))
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const url = `http://127.0.0.1:${address.port}/email/sending/send`
  return {
    url,
    sent,
    state,
    held: held.promise,
    releaseHeld: () => {
      for (const reply of heldReplies.splice(0)) reply()
    },
  }
}

export const PASSWORD = 'senha-certa-1'
export const SESSIONS = '/api/sessions/current'
export const SESSION_COOKIE =
  /^__Host-conexus_session=([^;]+); Max-Age=1800; Path=\/; HttpOnly; Secure; SameSite=Lax$/
export const ANA_ACCOUNT = { id: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' }
export const ANA = { name: 'Ana Lima', email: 'ana@example.test', role: 'admin' }
/** Ana as a person who owns a company, not the operator. */
export const ANA_OWNER = { name: ANA.name, email: ANA.email }
export const BRUNO = { name: 'Bruno Reis', email: 'bruno@example.test' }
export const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
export const INVITEE = 'davi@example.test'

type Change = (config: Config) => Config

async function hubServing(
  t: TestContext,
  mailApiUrl?: string,
  log: FailureLog = silent,
  change?: Change,
) {
  const test = await createTestDatabase(t)
  const config = (change ?? ((same) => same))(testConfig(test.runtimeUrl, mailApiUrl))
  const status = createStatus({ version: config.version, database: test.database })
  const neon = fakeNeon()
  const identity = identityOf({ database: test.database, config, log: silent })
  const cloudflare = fakeCloudflare()
  const postgres = heldCompanyPostgres(config)
  const ports = testAppPorts(config, { neon, cloudflare, postgres })
  const { projects, operations, apps, modelAccounts, conversations } = subjectsOf({
    mastraPool: test.mastraPool,
    database: test.database,
    config,
    identity,
    ...ports,
    log,
  })
  const webRoot = testWebRoot(t)
  const app = await createHub(config, {
    status,
    identity,
    operations,
    projects,
    apps,
    modelAccounts,
    conversations,
    webRoot,
  })
  // As at shutdown: the Builder's turns drain and end their streams before the server closes.
  t.after(async () => {
    await conversations.close()
    await app.close()
  })
  const edge = await createEdgeHub(config, { apps })
  t.after(() => edge.close())
  return { app, edge, test, config, neon, cloudflare, postgres, projects, repair: apps.repair }
}

/** A Hub on a fresh test database; its mail goes nowhere. */
export function hubOn(t: TestContext) {
  return hubServing(t)
}

export type Hub = Awaited<ReturnType<typeof hubOn>>
export type MailHub = Hub & { mail: Awaited<ReturnType<typeof mailServer>> }

/** A Hub logging into `lines`, fields and message; `change` sets its config apart from the test one. */
export async function hubWithLog(t: TestContext, change?: Change) {
  const lines: { fields: Record<string, unknown>; message: string }[] = []
  const log = {
    info: (fields: Record<string, unknown>, message: string) => lines.push({ fields, message }),
    error: (fields: Record<string, unknown>, message: string) => lines.push({ fields, message }),
  }
  return { ...(await hubServing(t, undefined, log, change)), lines }
}

/** A Hub whose mail goes to a fake of the provider. */
export async function hubWithMail(t: TestContext): Promise<MailHub> {
  const mail = await mailServer(t)
  return { ...(await hubServing(t, mail.url)), mail }
}

/** A Hub that holds Ana's account, which `signedIn` signs in. */
export async function hubWithAna(t: TestContext): Promise<Hub> {
  const hub = await hubOn(t)
  await hub.test.asOwner(`insert into auth.user (id, name, email) values ($1, $2, $3)`, [
    ANA_ACCOUNT.id,
    ANA_ACCOUNT.name,
    ANA_ACCOUNT.email,
  ])
  await hub.test.asOwner(
    `insert into auth.account (id, account_id, provider_id, user_id, password, updated_at)
      values ('account-ana', $1, 'credential', $1, $2, now())`,
    [ANA_ACCOUNT.id, await hashPassword(PASSWORD)],
  )
  return hub
}

export function signIn(hub: Hub, body: unknown, headers: Record<string, string> = {}) {
  return hub.app.inject({
    method: 'PUT',
    url: SESSIONS,
    headers: { ...WRITE_HEADERS, ...headers },
    payload: JSON.stringify(body),
  })
}

export async function signedIn(hub: Hub): Promise<string> {
  const response = await signIn(hub, { email: ANA_ACCOUNT.email, password: PASSWORD })
  assert.equal(response.statusCode, 200)
  return String(response.headers['set-cookie']).split(';')[0] ?? ''
}

export function read(hub: Hub, cookie?: string) {
  return hub.app.inject({ method: 'GET', url: SESSIONS, headers: cookie ? { cookie } : {} })
}

export function signOut(hub: Hub, cookie: string, headers: Record<string, string> = {}) {
  return hub.app.inject({
    method: 'DELETE',
    url: SESSIONS,
    headers: { origin: TEST_ORIGIN, cookie, ...headers },
  })
}

export function problem(response: { json(): unknown }) {
  const { traceId, ...rest } = Object(response.json())
  assert.match(String(traceId), /^[0-9a-f-]{36}$/)
  return rest
}

export function refusal(code: string, status: number, title: string) {
  return { type: `urn:conexus:problem:${code}`, title, status, code }
}

export function id(): string {
  return randomBytes(16).toString('hex')
}

export type Who = { name: string; email: string; role?: string }

/** A person with a password, signed in from a random address: their id and session cookie. */
export async function personOn(hub: Hub, who: Who) {
  const personId = id()
  await hub.test.asOwner('insert into auth.user (id, name, email, role) values ($1, $2, $3, $4)', [
    personId,
    who.name,
    who.email,
    who.role ?? 'user',
  ])
  await hub.test.asOwner(
    `insert into auth.account (id, account_id, provider_id, user_id, password, updated_at)
      values ($1, $2, 'credential', $2, $3, now())`,
    [id(), personId, await hashPassword(PASSWORD)],
  )
  const response = await hub.app.inject({
    method: 'PUT',
    url: SESSIONS,
    headers: {
      origin: TEST_ORIGIN,
      'content-type': 'application/json',
      'cf-connecting-ip': `198.51.100.${Math.floor(Math.random() * 250) + 1}`,
    },
    payload: JSON.stringify({ email: who.email, password: PASSWORD }),
  })
  assert.equal(response.statusCode, 200)
  return { id: personId, cookie: String(response.headers['set-cookie']).split(';')[0] ?? '' }
}

export type Person = Awaited<ReturnType<typeof personOn>>

export function post(
  hub: Hub,
  person: Person,
  url: string,
  body: unknown,
  key: string = randomUUID(),
) {
  return hub.app.inject({
    method: 'POST',
    url,
    headers: {
      origin: TEST_ORIGIN,
      'content-type': 'application/json',
      [ATTEMPT_KEY_HEADER]: key,
      cookie: person.cookie,
    },
    payload: JSON.stringify(body),
  })
}

export function call(
  hub: Hub,
  person: Person,
  method: 'GET' | 'PUT' | 'DELETE',
  url: string,
  body?: object,
) {
  return hub.app.inject({
    method,
    url,
    headers: {
      origin: TEST_ORIGIN,
      cookie: person.cookie,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { payload: JSON.stringify(body) } : {}),
  })
}

export function codeOf(response: { json(): unknown }): unknown {
  return Object(response.json()).code
}

/**
 * A company as its rows, with `ownerId` its owner: since step 4.2 only the Operations Central
 * creates one, and it is born with no member. Its owner has chosen a nickname, unless `nickname`
 * says `null`.
 */
export async function plantCompany(
  test: TestDatabase,
  ownerId: string,
  name = 'Empresa Teste',
  nickname?: string | null,
) {
  const companyId = id()
  await test.asOwner(
    `insert into auth.company (id, name, slug, created_at, attempt_key, nickname)
      values ($1, $2, $1, now(), $1, $3)`,
    [companyId, name, nickname === undefined ? `empresa-${companyId.slice(0, 8)}` : nickname],
  )
  await test.asOwner(
    `insert into auth.member (id, company_id, user_id, role, created_at)
      values ($1, $2, $3, 'owner', now())`,
    [id(), companyId, ownerId],
  )
  return companyId
}

/** A person with a password who is a member of the company at the role, planted as `plantCompany` is. */
export async function memberOn(hub: Hub, companyId: string, who: Who, role: string) {
  const person = await personOn(hub, who)
  await hub.test.asOwner(
    `insert into auth.member (id, company_id, user_id, role, created_at)
      values ($1, $2, $3, $4, now())`,
    [id(), companyId, person.id, role],
  )
  return person
}

/**
 * Ana owns Empresa Teste, as a person and not the operator, who is never a member (step 4.2);
 * `invite` has her invite as an administrator.
 */
export async function companyOn(t: TestContext) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  async function invite(email = INVITEE, key?: string): Promise<string> {
    const body = { email, role: 'admin' }
    const response = await post(hub, ana, `/api/companies/${companyId}/invitations`, body, key)
    assert.equal(response.statusCode, 201)
    return String(Object(response.json()).invitation.id)
  }
  return { hub, ana, companyId, invite }
}
