import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import type { CompanyId, CopyId, CopyInterval, ProjectId } from '@conexus/hub-api'
import {
  CompanyId as CompanyIdSchema,
  ConnectionId,
  PersonId,
  ProjectId as ProjectIdSchema,
} from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import pg from 'pg'
import { z } from 'zod'
import type { DatabaseUrl } from '../../platform/database.ts'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import { CopyName } from '../connectors/public.ts'
import { forward, linkSankhya, testOf } from '../connectors/test-connections.ts'
import { sankhyaFake } from '../connectors/test-sales.ts'
import type { Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  CARLA,
  hubWithLog,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'
import type { CopyClock, CopyTuning } from './public.ts'
import { createCopies } from './public.ts'

/**
 * In front of the Sankhya double: a page of a copy can be held until the test lets it go, and a
 * row of the answer left out, as a sale gone from the source.
 */
function gateOf(t: TestContext) {
  const gate = {
    /** Pages held, by their number among every copy page asked. */
    holds: new Map<
      number,
      { arrived: PromiseWithResolvers<void>; released: PromiseWithResolvers<void> }
    >(),
    /** The first cell of each row the source no longer has. */
    gone: new Set<string>(),
    /** Every copy page asked, in order. */
    pages: 0,
  }
  return {
    gate,
    through: async (origin: string) => {
      const server = createServer(async (incoming, outgoing) => {
        const chunks: Buffer[] = []
        for await (const chunk of incoming) chunks.push(z.instanceof(Buffer).parse(chunk))
        const body = Buffer.concat(chunks)
        const isPage = body.toString('utf8').includes(' AS C0_')
        if (isPage) {
          gate.pages += 1
          const held = gate.holds.get(gate.pages)
          if (held !== undefined) {
            held.arrived.resolve()
            await held.released.promise
          }
        }
        // A silent double never answers: the Hub gives up and closes, and so does this door.
        const answered = await forward(origin, incoming, body).catch(() => undefined)
        if (answered === undefined) {
          outgoing.destroy()
          return
        }
        let sent = answered.body
        if (isPage && gate.gone.size > 0 && answered.status === 200) {
          const parsed = JSON.parse(sent.toString('utf8'))
          const rows = parsed?.responseBody?.rows
          if (Array.isArray(rows)) {
            parsed.responseBody.rows = rows.filter((row) => !gate.gone.has(String(row[0])))
            sent = Buffer.from(JSON.stringify(parsed))
          }
        }
        const headers = { ...answered.headers }
        delete headers['content-length']
        outgoing.writeHead(answered.status, headers)
        outgoing.end(sent)
      })
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
      t.after(() => {
        server.closeAllConnections()
        server.close()
      })
      const { port } = z.object({ port: z.number() }).parse(server.address())
      return `http://127.0.0.1:${port}`
    },
  }
}

/** The clock as a double that notes each call (T20): the run is called directly by the test. */
function clockDouble() {
  const calls: string[] = []
  const clock: CopyClock = {
    set: async ({ copyId, interval }) => void calls.push(`set ${copyId} ${interval}`),
    pause: async (copyId) => void calls.push(`pause ${copyId}`),
    resume: async (copyId) => void calls.push(`resume ${copyId}`),
    runNow: async (copyId) => void calls.push(`runNow ${copyId}`),
    remove: async (copyId) => void calls.push(`remove ${copyId}`),
    states: async () => new Map(),
  }
  return { clock, calls }
}

/** Short ceilings for the tests (T20): pages of 50 rows, a lease the test can outlive. */
export const TEST_TUNING = { pageRows: 50, runPages: 200, runMs: 60_000, leaseMs: 60_000 }

/**
 * Empresa A on a test Hub whose Sankhya is the kit's double: Ana its owner, Carla a member, the
 * Projeto Pedidos with no app, the company's database on the test server, and the Matriz linked
 * and tested. The copies are assembled over the Hub's own subjects, the clock a double.
 */
export async function copiesOn(t: TestContext, tuning: CopyTuning = TEST_TUNING) {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const { gate, through } = gateOf(t)
  const origin = await through(served.origin)
  const hub = await hubWithLog(t, (config) => ({
    ...config,
    connectorOrigins: new Map([['sankhya', origin]]),
  }))
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = CompanyIdSchema.parse(
    await plantCompany(hub.test, ana.id, 'Empresa A', 'empresa-a'),
  )
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const projects = `/api/companies/${companyId}/projects`
  const made = await post(hub, ana, projects, { name: 'Pedidos' })
  assert.equal(made.statusCode, 201, made.body)
  const projectId = ProjectIdSchema.parse(Object(made.json()).project.id)
  const [neonProject] = hub.neon.projects()
  assert.ok(neonProject, 'the company database')
  const owner = await createCompanyDatabase(t)
  hub.neon.ownedBy(neonProject.id, owner)
  const connections = `/api/companies/${companyId}/connections`
  const linked = await linkSankhya(hub, ana, connections, fake.credential)
  assert.equal(linked.statusCode, 201, linked.body)
  const connectionId = ConnectionId.parse(Object(linked.json()).connection.id)
  const tested = await testOf(hub, ana, connections, connectionId)
  assert.equal(Object(tested.json()).connection?.state, 'ACTIVE', tested.body)
  const { clock, calls } = clockDouble()
  const hubState = { updating: false }
  const copies = createCopies({
    ...{ database: hub.test.database, identity: hub.identity, projects: hub.projects.ports },
    ...{ neon: hub.neon.neon, companyPostgres: hub.postgres.companyPostgres },
    connectors: () => hub.connectors.copies,
    apps: () => hub.apps,
    clock: () => clock,
    log: { info: hubLog(hub.lines), error: hubLog(hub.lines) },
    updating: () => hubState.updating,
    tuning,
  })
  const anaId = PersonId.parse(ana.id)
  /** Ligar as Ana, with a fresh attempt key unless one is given. */
  function enable(model: string, options: { key?: string; interval?: CopyInterval } = {}) {
    return copies.enable({
      ...{ companyId, personId: anaId, connectionId },
      source: { kind: 'MODEL', model: CopyName.parse(model) },
      interval: options.interval ?? '30m',
      attemptKey: options.key ?? randomUUID(),
    })
  }
  function run(copyId: CopyId, signal = new AbortController().signal) {
    return copies.run({ companyId, copyId }, signal)
  }
  return {
    ...{ hub, fake, gate, ana, anaId, carla, companyId, projectId, owner, connectionId },
    ...{ copies, calls, hubState, enable, run, projects, connections },
  }
}

export type CopiesOn = Awaited<ReturnType<typeof copiesOn>>

function hubLog(lines: { fields: Record<string, unknown>; message: string }[]) {
  return (fields: Record<string, unknown>, message: string) => {
    lines.push({ fields, message })
  }
}

/** Holds the `nth` copy page from now at the double's door until `release`; `arrived` resolves when it waits. */
export function holdPage(on: CopiesOn, nth = 1) {
  const held = { arrived: Promise.withResolvers<void>(), released: Promise.withResolvers<void>() }
  on.gate.holds.set(on.gate.pages + nth, held)
  return { arrived: held.arrived.promise, release: () => held.released.resolve() }
}

/** As the Hub's owner: a copy's row set as a test needs it (the pass's start, a lease another left). */
export async function plantCopy(on: CopiesOn, copyId: CopyId, set: string, values: unknown[] = []) {
  const client = new pg.Client({ connectionString: on.hub.test.ownerUrl.reveal() })
  await client.connect()
  try {
    await client.query(`update copies.copy set ${set} where id = $1`, [copyId, ...values])
  } finally {
    await client.end()
  }
}

/** As the sync login, which the owner holds by SET alone: the copies' tables are its own. */
export async function asSync<T>(owner: DatabaseUrl, act: (client: pg.Client) => Promise<T>) {
  const client = new pg.Client({ connectionString: owner.reveal() })
  await client.connect()
  try {
    await client.query('begin')
    await client.query('set local role conexus_sync')
    const done = await act(client)
    await client.query('commit')
    return done
  } finally {
    await client.end()
  }
}

/** The copy's table: each row's key cells as text, in key order, and its pass. */
export function syncRows(owner: DatabaseUrl, name: string, key: readonly string[]) {
  const columns = key.map((column) => `"${column}"::text`).join(', ')
  return asSync(owner, async (client) => {
    const result = await client.query({
      text: `select ${columns}, _pass from sync."${name}" order by ${key.map((k) => `"${k}"`).join(', ')}`,
      rowMode: 'array',
    })
    return result.rows.map((row: unknown[]) => row.map(String))
  })
}

/** The copy's row in the Hub, as the run left it. */
export async function copyRowOf(on: CopiesOn, copyId: CopyId) {
  const result = await on.hub.test.database.read(
    { kind: 'COMPANY', companyId: on.companyId, personId: null },
    (tx) =>
      tx.execute(
        sql`select pass, position, watermark, pass_started_at, rows, claim_token, last_run_id from copies.copy where id = ${copyId}`,
      ),
  )
  return Object(result.rows[0])
}

/** The copy's runs, newest first. */
export async function runsOf(on: CopiesOn, copyId: CopyId) {
  const result = await on.hub.test.database.read(
    { kind: 'COMPANY', companyId: on.companyId, personId: null },
    (tx) =>
      tx.execute(
        sql`select outcome, reason, pages, read, written, ended_at from copies.copy_run where copy_id = ${copyId} order by started_at desc`,
      ),
  )
  return result.rows.map((row) => Object(row))
}

export { TEST_APP_LOGIN_KEY } from '../../platform/test-cloudflare.ts'
export type { CompanyId, Person, ProjectId }
