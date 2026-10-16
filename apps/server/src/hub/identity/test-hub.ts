import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { ATTEMPT_KEY_HEADER } from '@conexus/hub-api'
import { hashPassword } from 'better-auth/crypto'
import { createHub, identityOf } from '../../main.ts'
import {
  createTestDatabase,
  silent,
  TEST_ORIGIN,
  testConfig,
  WRITE_HEADERS,
} from '../../platform/test-database.ts'
import { createStatus } from '../status/public.ts'

export type Mail = { to: string; subject: string; text: string }
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
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (state.mode === 'HOLD') {
        heldReplies.push(() => {
          sent.push({ to: body.to, subject: body.subject, text: body.text })
          response.writeHead(200, { 'content-type': 'application/json' })
          response.end(
            JSON.stringify({
              success: true,
              result: { delivered: [body.to], permanent_bounces: [], queued: [] },
            }),
          )
        })
        return held.resolve()
      }
      if (state.mode === 'FAIL') return response.writeHead(500).end()
      sent.push({ to: body.to, subject: body.subject, text: body.text })
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
export const BRUNO = { name: 'Bruno Reis', email: 'bruno@example.test' }
export const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
export const INVITEE = 'davi@example.test'

async function hubServing(t: TestContext, mailApiUrl?: string) {
  const test = await createTestDatabase(t)
  const config = testConfig(test.runtimeUrl, mailApiUrl)
  const status = createStatus({ version: config.version, database: test.database })
  const identity = identityOf({ database: test.database, config, log: silent })
  const app = await createHub(config, { status, identity })
  t.after(() => app.close())
  return { app, test }
}

/** A Hub on a fresh test database; its mail goes nowhere. */
export function hubOn(t: TestContext) {
  return hubServing(t)
}

export type Hub = Awaited<ReturnType<typeof hubOn>>
export type MailHub = Hub & { mail: Awaited<ReturnType<typeof mailServer>> }

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

export function codeOf(response: { json(): unknown }): unknown {
  return Object(response.json()).code
}

/** Ana, the administrator, owns Empresa Teste; `invite` has her invite as an administrator. */
export async function companyOn(t: TestContext) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const created = await post(hub, ana, '/api/companies', { name: 'Empresa Teste' })
  const companyId = String(Object(created.json()).company.id)
  async function invite(email = INVITEE, key?: string): Promise<string> {
    const body = { email, role: 'admin' }
    const response = await post(hub, ana, `/api/companies/${companyId}/invitations`, body, key)
    assert.equal(response.statusCode, 201)
    return String(Object(response.json()).invitation.id)
  }
  return { hub, ana, companyId, invite }
}
