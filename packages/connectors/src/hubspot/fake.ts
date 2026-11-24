import { setTimeout as sleep } from 'node:timers/promises'
import { z } from 'zod'
import type { OAuthFake } from '../kernel/conformance-session.ts'
import { serveOnLoopback } from '../kernel/loopback.ts'
import type { Held } from '../kernel/oauth-double.ts'
import { authorizePage, exchangeCode, nextKey, tokenRoute } from '../kernel/oauth-double.ts'
import { APP, REDIRECT_URI as DEFAULT_REDIRECT_URI, OBJECTS, PORTAL } from './fake-data.ts'

/** What the fake can be told to do wrong: the Hub's tests flip these. */
type Switches = {
  /** The next authorization answers `error=access_denied`, as when the person says no. */
  refuse: boolean
  /** Every renewal answers 400 `invalid_grant`, as after the user took the app's access away. */
  revoke: boolean
  /** Every call to the CRM, the reads and the note's create, answers 403 `MISSING_SCOPES`, as when the app lacks the scope. */
  readRefused: boolean
  /** The `expires_in` the exchange and the renewal give. */
  expiresInSeconds: number
  /** Milliseconds each renewal is held back. */
  slowMilliseconds: number
}

export type HubspotFake = OAuthFake &
  Readonly<{
    switches: Switches
    /** How many renewals were answered with new keys. */
    refreshes: () => number
    /** The access keys issued so far expire (401); a renewal gives a good one. */
    expireAccess: () => void
    /** The bodies of the notes created, in order. */
    notes: () => readonly Record<string, unknown>[]
    /** How many reads and writes of the CRM and the account call were answered, whatever the answer. */
    calls: () => number
  }>

type World = {
  app: typeof APP
  switches: Switches
  redirectUri: string
  codes: Map<string, Held<object>>
  access: Map<string, { expired: boolean }>
  refresh: Map<string, { current: boolean }>
  count: { issued: number; renewals: number; calls: number }
  notes: Record<string, unknown>[]
  deals: Deal[] // a copy per double: a test route changes or removes one between two reads
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status })
}

/** RFC 6749 §5.2, the shape the connector's refusals list (a confirmar na gravação). */
function oauthError(error: string, status: number): Response {
  return json({ error, error_description: error }, status)
}

/** New keys: the refresh key held before stops being the current one. */
function issue(world: World): Response {
  for (const held of world.refresh.values()) held.current = false
  const accessToken = nextKey(world, 'na1')
  const refreshToken = nextKey(world, 'rt')
  world.access.set(accessToken, { expired: false })
  world.refresh.set(refreshToken, { current: true })
  return json({
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: world.switches.expiresInSeconds,
    refresh_token: refreshToken,
  })
}

function authorization(world: World, url: URL): Response {
  const { switches } = world
  return authorizePage(world, url, {
    prefix: 'cd',
    invalid: () => oauthError('invalid_request', 400),
    refuses: () => {
      const refuse = switches.refuse
      switches.refuse = false
      return refuse
    },
    extra: () => ({}),
  })
}

function exchange(world: World, form: URLSearchParams): Response {
  return exchangeCode(world, form, {
    invalid: () => oauthError('invalid_grant', 400),
    issue: () => issue(world),
  })
}

async function renew(world: World, form: URLSearchParams): Promise<Response> {
  await sleep(world.switches.slowMilliseconds)
  const held = world.refresh.get(form.get('refresh_token') ?? '')
  if (world.switches.revoke || !held?.current) return oauthError('invalid_grant', 400)
  world.count.renewals += 1
  return issue(world)
}

/** HubSpot's own error body: `status`, `message`, `category` and `correlationId`. */
function failure(status: number, category: string, message: string): Response {
  return json({ status: 'error', message, correlationId: 'fake-correlation', category }, status)
}

function bearing(world: World, request: Request): Response | null {
  const given = world.access.get(
    request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '',
  )
  return given && !given.expired
    ? null
    : failure(401, 'EXPIRED_AUTHENTICATION', 'The OAuth token used to make this call expired.')
}

type Deal = (typeof OBJECTS.deals)[number]

/** When a test route changes a deal: after every record of the double. */
const CHANGED_BY_TEST = new Date(Date.UTC(2026, 10, 20, 13, 0, 0)).toISOString()

const DealChange = z.object({ acao: z.enum(['ALTERAR', 'REMOVER']) })

/** The double's own route, which no real HubSpot has: a test changes or removes a deal between two reads. */
async function changedDeal(world: World, request: Request, id: string): Promise<Response> {
  const at = world.deals.findIndex((deal) => deal.id === id)
  const deal = world.deals[at]
  if (request.method !== 'POST' || deal === undefined)
    return failure(404, 'RESOURCE_NOT_FOUND', 'resource not found')
  const { acao } = DealChange.parse(await request.json())
  if (acao === 'REMOVER') world.deals.splice(at, 1)
  else
    world.deals[at] = {
      ...deal,
      updatedAt: CHANGED_BY_TEST,
      properties: { ...deal.properties, amount: '1', hs_lastmodifieddate: CHANGED_BY_TEST },
    }
  return json({ id })
}

function listed(world: World, name: string, url: URL): Response {
  const rows =
    name === 'contacts' ? OBJECTS.contacts : name === 'companies' ? OBJECTS.companies : world.deals
  const limit = Number(url.searchParams.get('limit') ?? 10)
  const after = Number(url.searchParams.get('after') ?? 0)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(after) || after < 0)
    return failure(400, 'VALIDATION_ERROR', 'Invalid paging.')
  const results = rows.slice(after, after + limit)
  const end = after + results.length
  return json({
    results,
    ...(end < rows.length ? { paging: { next: { after: String(end) } } } : {}),
  })
}

const NoteBody = z.looseObject({
  properties: z.record(z.string(), z.unknown()),
  associations: z.tuple([z.looseObject({ to: z.looseObject({ id: z.string() }) })]),
})

async function created(world: World, request: Request): Promise<Response> {
  const body = NoteBody.safeParse(await request.json())
  if (!body.success || !OBJECTS.contacts.some((one) => one.id === body.data.associations[0].to.id))
    return failure(400, 'VALIDATION_ERROR', 'The association target does not exist.')
  world.notes.push(body.data)
  const id = String(9000 + world.notes.length)
  const at = new Date(Date.UTC(2026, 10, 9, 13, 0, 0)).toISOString()
  return json(
    { id, properties: body.data.properties, createdAt: at, updatedAt: at, archived: false },
    201,
  )
}

async function crm(world: World, request: Request, url: URL): Promise<Response> {
  world.count.calls += 1
  const refused = bearing(world, request)
  if (refused) return refused
  if (url.pathname === '/account-info/v3/details' && request.method === 'GET')
    return json({ portalId: PORTAL.id, accountType: 'STANDARD', timeZone: 'America/Sao_Paulo' })
  if (world.switches.readRefused)
    return failure(403, 'MISSING_SCOPES', "This app hasn't been granted all required scopes.")
  const listing = /^\/crm\/v3\/objects\/(contacts|companies|deals)$/.exec(url.pathname)
  if (listing?.[1] !== undefined && request.method === 'GET') return listed(world, listing[1], url)
  if (url.pathname === '/crm/v3/objects/notes' && request.method === 'POST')
    return created(world, request)
  return failure(404, 'RESOURCE_NOT_FOUND', 'resource not found')
}

async function handle(world: World, request: Request): Promise<Response> {
  const url = new URL(request.url)
  const testing = /^\/__teste\/negocios\/(\d+)$/.exec(url.pathname)?.[1]
  if (testing !== undefined) return changedDeal(world, request, testing)
  if (url.pathname === '/oauth/authorize' && request.method === 'GET')
    return authorization(world, url)
  if (url.pathname === '/oauth/2026-09/token' && request.method === 'POST')
    return tokenRoute(world, request, oauthError, { exchange, renew })
  return crm(world, request, url)
}

/**
 * A HubSpot that answers in the shape the shelf's functions read, with invented data. It takes the
 * Hub's `redirectUri` as configuration and refuses any other. The authorization page answers 302
 * to the redirect; the code works once, with the verifier and the redirect it was asked for; only the
 * last refresh key counts.
 */
export function hubspotFake({
  redirectUri = DEFAULT_REDIRECT_URI,
}: Readonly<{ redirectUri?: string }> = {}): HubspotFake {
  const switches: Switches = {
    refuse: false,
    revoke: false,
    readRefused: false,
    expiresInSeconds: 1800,
    slowMilliseconds: 0,
  }
  const world: World = {
    app: APP,
    switches,
    redirectUri,
    codes: new Map(),
    access: new Map(),
    refresh: new Map(),
    count: { issued: 0, renewals: 0, calls: 0 },
    notes: [],
    deals: OBJECTS.deals.map((deal) => ({ ...deal, properties: { ...deal.properties } })),
  }
  return {
    app: APP,
    redirectUri,
    handle: (request) => handle(world, request),
    serve: () => serveOnLoopback((request) => handle(world, request)),
    switches,
    refreshes: () => world.count.renewals,
    expireAccess: () => {
      for (const given of world.access.values()) given.expired = true
    },
    notes: () => world.notes,
    calls: () => world.count.calls,
  }
}
