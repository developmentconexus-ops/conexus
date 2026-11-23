import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import type { TestContext } from 'node:test'
import { AppHost, appOfHost } from '@conexus/hub-api'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  hubWithMail,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'

export const PEDIDOS = 'pedidos--empresa-a'
export const ESTOQUE = 'estoque--empresa-a'
/** The Prévia's hosts of Pedidos and Estoque. */
export const PEDIDOS_PREVIA = 'pedidos--empresa-a--previa'
export const ESTOQUE_PREVIA = 'estoque--empresa-a--previa'

/** A browser's binding: the secret its cookie on the app's host holds, and the hash the Hub keeps. */
export function browser() {
  const binding = randomBytes(32).toString('base64url')
  return { binding, hash: createHash('sha256').update(binding).digest('base64url') }
}

/** Empresa A with Ana its owner, Bruno a member, and the Projetos Pedidos and Estoque. */
export async function companyWithApps(t: TestContext) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa A', 'empresa-a')
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const projects = `/api/companies/${companyId}/projects`
  const made = await post(hub, ana, projects, { name: 'Pedidos' })
  await post(hub, ana, projects, { name: 'Estoque' })
  const projectId = String(Object(made.json()).project.id)
  return { hub, ana, bruno, companyId, projectId, project: `${projects}/${projectId}` }
}

/** A navigation from the app's host, as the browser sends it after the dispatcher's 303. */
export const FROM_THE_APP = {
  'sec-fetch-site': 'cross-site',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-dest': 'document',
}

export function openPath(body: { host: string; binding: string }) {
  return `/apps/open?${new URLSearchParams(body)}`
}

export function handoff(
  hub: Hub,
  person: Person | undefined,
  body: { host: string; binding: string },
  headers: Record<string, string> = FROM_THE_APP,
) {
  return hub.app.inject({
    method: 'GET',
    url: openPath(body),
    headers: { ...headers, ...(person ? { cookie: person.cookie } : {}) },
  })
}

/**
 * The Prévia's pass: the Hub's own page asks for it with the person's session and the binding hash
 * the app's entry page sent it from the frame (step 14.1, U2).
 */
export function frameHandoff(
  hub: Hub,
  person: Person | undefined,
  body: { host: string; binding: string },
  headers: Record<string, string> = { origin: TEST_ORIGIN },
) {
  return hub.app.inject({
    method: 'POST',
    url: '/api/apps/frame-handoff',
    headers: {
      'content-type': 'application/json',
      ...headers,
      ...(person ? { cookie: person.cookie } : {}),
    },
    payload: JSON.stringify(body),
  })
}

/** How many passes the Hub holds. */
export async function passes(hub: Hub) {
  return Object((await hub.test.asOwner(`select count(*)::int as n from apps.handoff`))[0]).n
}

/** The dispatcher's trade of a pass for the app's session, on the edge listener. */
export function redeem(hub: Hub, body: { host: string; code: string; binding: string }) {
  return hub.edge.inject({
    method: 'POST',
    url: '/api/app-sessions',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify(body),
  })
}

/**
 * The pass the Hub gives the person for this browser, as the code in its location: through
 * `/apps/open` on the published app's host, or the Prévia frame's on the Prévia's.
 */
export async function codeFor(hub: Hub, person: Person, host: string, hash: string) {
  const body = { host, binding: hash }
  const published = appOfHost(AppHost.parse(host)).environment === 'published'
  const made = published ? await handoff(hub, person, body) : await frameHandoff(hub, person, body)
  assert.equal(made.statusCode, published ? 303 : 200)
  const location = published ? made.headers.location : Object(made.json()).location
  return String(new URL(String(location)).searchParams.get('code'))
}

/** An app session of the person on the host, as the dispatcher holds it. */
export async function sessionOf(hub: Hub, person: Person, host: string) {
  const { binding, hash } = browser()
  const redeemed = await redeem(hub, {
    host,
    code: await codeFor(hub, person, host, hash),
    binding,
  })
  assert.equal(redeemed.statusCode, 201)
  return String(Object(redeemed.json()).session)
}
