import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import type { CopyId } from '@conexus/hub-api'
import {
  CompanyId,
  ConnectionId,
  CopyId as CopyIdSchema,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import { z } from 'zod'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import type { ConnectorTuning } from '../connectors/public.ts'
import { CopyDefinitionV2 } from '../connectors/public.ts'
import {
  forward,
  linkMercadoLivre,
  mercadoLivreOn,
  testOf,
} from '../connectors/test-connections.ts'
import { post } from '../identity/test-hub.ts'
import type { CopyTuning } from './public.ts'
import { createCopies } from './public.ts'
import { asSync, clockDouble, hubLog, TEST_TUNING } from './test-copies.ts'

export { BY_ACCOUNT, CEILED, catalogWith } from '../connectors/test-catalog.ts'

/** Two stores of the double, each its own account. */
export const STORE_A = { ref: '111000111', label: 'LOJA_A' }
export const STORE_B = { ref: '222000222', label: 'LOJA_B' }

/** Version 2 over `pedidos`: each order's id, status and the instant it last changed. */
export function ordersCopy(changed: boolean): CopyDefinitionV2 {
  return CopyDefinitionV2.parse({
    version: 2,
    source: { kind: 'OPERATION', operation: 'pedidos', input: {} },
    description: 'Os pedidos de cada loja',
    columns: [
      { name: 'id', type: 'bigint', path: 'id', description: 'O número do pedido' },
      { name: 'status', type: 'text', path: 'status' },
      { name: 'atualizado', type: 'timestamp', path: 'date_last_updated' },
    ],
    key: ['id'],
    changedSince: changed ? { column: 'atualizado' } : null,
  })
}

/** Version 2 over `anuncios`: the scan's ids, read by a cursor. */
export const ITEMS_COPY = CopyDefinitionV2.parse({
  version: 2,
  source: { kind: 'OPERATION', operation: 'anuncios', input: {} },
  description: 'Os anúncios da loja',
  columns: [{ name: 'id', type: 'text', path: 'id' }],
  key: ['id'],
  changedSince: null,
})

type Door = {
  /** Each data call the Hub made to the double, its path and query, in order. */
  seen: URL[]
  /** The calls (counted from 1 among the data calls) answered 429, with the `Retry-After` each carries. */
  busy: Map<number, string | null>
  /** Data calls open at the double right now, and the most ever open together. */
  open: number
  most: number
  /** While set, each data call waits for it before it reaches the double. */
  held: PromiseWithResolvers<void> | undefined
}

const DATA = /^\/(orders\/search|users\/[0-9]+\/items\/search)/

/** In front of the double: the data calls noted, counted while open, held, or answered 429 as the test says. */
export function doorOf(t: TestContext) {
  const door: Door = { seen: [], busy: new Map(), open: 0, most: 0, held: undefined }
  return {
    door,
    through: async (origin: string) => {
      const server = createServer(async (incoming, outgoing) => {
        const chunks: Buffer[] = []
        for await (const chunk of incoming) chunks.push(z.instanceof(Buffer).parse(chunk))
        const url = new URL(incoming.url ?? '/', 'http://double')
        const data = DATA.test(url.pathname)
        if (data) {
          door.seen.push(url)
          door.open += 1
          door.most = Math.max(door.most, door.open)
        }
        try {
          if (data && door.held !== undefined) await door.held.promise
          const busy = data ? door.busy.get(door.seen.length) : undefined
          if (busy !== undefined) {
            outgoing.writeHead(429, {
              'content-type': 'application/json',
              ...(busy === null ? {} : { 'retry-after': busy }),
            })
            outgoing.end(JSON.stringify({ message: 'too many requests', status: 429 }))
            return
          }
          const body = incoming.method === 'GET' ? undefined : Buffer.concat(chunks)
          const answered = await forward(origin, incoming, body)
          const headers = { ...answered.headers }
          delete headers['content-length']
          delete headers['content-encoding']
          outgoing.writeHead(answered.status, headers)
          outgoing.end(answered.body)
        } finally {
          if (data) door.open -= 1
        }
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

/** The calls the door saw for one store: the orders asked of it, or its scan. */
export function callsOf(door: Door, store: { ref: string }) {
  return door.seen.filter(
    (url) => url.searchParams.get('seller') === store.ref || url.pathname.includes(store.ref),
  )
}

type MercadoLivreOn = Awaited<ReturnType<typeof mercadoLivreOn>>
type Store = Readonly<{ ref: string; label: string }>

/** Each store linked and tested on Empresa Teste as its own account: its connection, by its account. */
async function linkedStores(on: MercadoLivreOn, list: readonly Store[]) {
  const stores = new Map<string, ConnectionId>()
  for (const [at, store] of list.entries()) {
    on.fake.switches.account = store
    const name = `Loja ${String.fromCharCode(65 + at)}`
    const linked = await linkMercadoLivre(on.hub, on.ana, on.companyId, {
      connector: 'mercado-livre',
      name,
    })
    assert.equal(Object(linked.json()).result, 'LINKED', linked.body)
    const connectionId = ConnectionId.parse(Object(linked.json()).connection.id)
    const tested = await testOf(on.hub, on.ana, on.base, connectionId)
    assert.equal(Object(tested.json()).connection?.state, 'ACTIVE', tested.body)
    stores.set(store.ref, connectionId)
  }
  return stores
}

/** The company's database on the test server with the `sync` schema made, unless `attached` is false. */
async function companyDatabaseOf(
  t: TestContext,
  on: MercadoLivreOn,
  ids: { companyId: CompanyId; personId: PersonId },
  attached: boolean,
) {
  const [neonProject] = on.hub.neon.projects()
  assert.ok(neonProject, 'the company database')
  const owner = await createCompanyDatabase(t)
  if (!attached) return owner
  on.hub.neon.ownedBy(neonProject.id, owner)
  assert.equal((await on.hub.postgres.companyPostgres.ensureSync(owner)).kind, 'DONE')
  const host = new URL(owner.reveal()).hostname
  await on.hub.test.database.command({ kind: 'COMPANY', ...ids }, (tx) =>
    on.hub.projects.ports.recordDatabaseHost(tx, { companyId: ids.companyId, host }),
  )
  return owner
}

/** The copies assembled over the Hub's own subjects, the clock a double. */
function copiesOver(hub: MercadoLivreOn['hub'], tuning: CopyTuning) {
  const { clock, calls } = clockDouble()
  const hubState = { updating: false }
  const copies = createCopies({
    ...{ database: hub.test.database, identity: hub.identity, projects: hub.projects.ports },
    ...{ neon: hub.neon.neon, companyPostgres: hub.postgres.companyPostgres },
    connectors: () => hub.connectors.copies,
    prove: () => hub.connectors.builder.provePage,
    apps: () => hub.apps,
    clock: () => clock,
    log: { info: hubLog(hub.lines), error: hubLog(hub.lines) },
    updating: () => hubState.updating,
    tuning,
  })
  return { copies, calls, hubState }
}

type Planting = Readonly<{
  hub: MercadoLivreOn['hub']
  stores: Map<string, ConnectionId>
  owner: Awaited<ReturnType<typeof createCompanyDatabase>>
  attached: boolean
}>

/** One more source of the copy, made `at` seconds after the first. */
function sourceOf(p: Planting, copyId: CopyId, connectionId: ConnectionId, at: number) {
  return p.hub.test.asOwner(
    `insert into copies.copy_source (company_id, copy_id, connector_id, connection_id, account_ref, created_at)
     select company_id, $1, connector_id, id, account_ref, now() + $3 * interval '1 second'
     from connectors.connection where id = $2`,
    [copyId, connectionId, at],
  )
}

/**
 * A version 2 copy as Ligar a proposal would leave it (U4 makes that path): the row, one source per
 * connection in the order given, each with its connection's account, and the table with the
 * account's columns.
 */
async function plantedBy(
  p: Planting,
  by: { companyId: CompanyId; personId: PersonId },
  copy: { name: string; definition: CopyDefinitionV2; refs: readonly string[] },
) {
  const { name, definition } = copy
  const copyId = CopyIdSchema.parse(randomUUID())
  const connections = copy.refs.map((ref) => p.stores.get(ref) ?? assert.fail(`the store ${ref}`))
  await p.hub.test.asOwner(
    `insert into copies.copy (id, company_id, connector_id, connection_id, name, label, definition,
       created_by, created_at, attempt_key, body_hash)
     values ($1, $2, 'mercado-livre', $3, $4, $4, $5, $6, now(), $7, 'planted')`,
    [
      copyId,
      by.companyId,
      connections[0],
      name,
      JSON.stringify(definition),
      by.personId,
      randomUUID(),
    ],
  )
  for (const [at, connectionId] of connections.entries())
    await sourceOf(p, copyId, connectionId, at)
  if (p.attached) {
    const sync = await p.hub.postgres.companyPostgres.syncAddress(
      new URL(p.owner.reveal()).hostname,
    )
    const table = { name, definition, accounts: true, instants: 'OFFSET' } as const
    assert.equal((await p.hub.postgres.companyPostgres.ensureCopyTable(sync, table)).kind, 'DONE')
  }
  return copyId
}

/**
 * Empresa Teste on a Hub whose Mercado Livre is the kit's double behind `door`, with `stores` linked
 * and tested, the Projeto Pedidos and the company's database on the test server, the `sync` schema
 * made. The copies are assembled over the Hub's own subjects, the clock a double.
 */
export async function storesOn(
  t: TestContext,
  a: {
    stores?: readonly Store[]
    catalog?: ConnectorTuning['catalog']
    now?: () => Date
    tuning?: CopyTuning
    /** No company database: a test that mocks every act on it, with another company on the same Hub. */
    companyDatabase?: boolean
  } = {},
) {
  const { door, through } = doorOf(t)
  const on = await mercadoLivreOn(t, { through, tuning: { catalog: a.catalog, now: a.now } })
  const { hub, fake, ana, carla, base } = on
  const companyId = CompanyId.parse(on.companyId)
  const anaId = PersonId.parse(ana.id)
  const stores = await linkedStores(on, a.stores ?? [STORE_A, STORE_B])
  door.seen.length = 0
  const made = await post(hub, ana, `/api/companies/${companyId}/projects`, { name: 'Pedidos' })
  assert.equal(made.statusCode, 201, made.body)
  const projectId = ProjectId.parse(Object(made.json()).project.id)
  const attached = a.companyDatabase !== false
  const owner = await companyDatabaseOf(t, on, { companyId, personId: anaId }, attached)
  const { copies, calls, hubState } = copiesOver(hub, a.tuning ?? TEST_TUNING)
  const planting = { hub, stores, owner, attached }
  function run(copyId: CopyId, signal = new AbortController().signal) {
    return copies.run({ companyId, copyId }, signal)
  }
  return {
    ...{ hub, fake, door, ana, anaId, carla, companyId, projectId, owner, stores, base },
    ...{ copies, calls, hubState, run },
    /** Empresa Teste's copy, enabled by Ana, unless `by` names another company. */
    planted: (
      name: string,
      definition: CopyDefinitionV2,
      refs: readonly string[],
      by = { companyId, personId: anaId },
    ) => plantedBy(planting, by, { name, definition, refs }),
    addSource: (copyId: CopyId, connectionId: ConnectionId, at: number) =>
      sourceOf(planting, copyId, connectionId, at),
    async ended(copyId: CopyId) {
      const end = await run(copyId)
      assert.equal(end.kind, 'ENDED')
      return end.kind === 'ENDED' ? end.outcome : undefined
    },
    /** Each source of the copy, in the order it was made, as the run left it. */
    sourcesOf: (copyId: CopyId) =>
      hub.test.asOwner(
        `select connection_id, account_ref, pass, position, watermark, wait_until, pass_started_at
         from copies.copy_source where copy_id = $1 order by created_at`,
        [copyId],
      ),
  }
}

/** The copy's table: each row's account, its name, its id as text and its pass, in that order. */
export function tableOf(on: Pick<Planting, 'owner'>, name: string) {
  return asSync(on.owner, async (client) => {
    const result = await client.query(
      `select _account, _account_name, id::text, _pass from sync."${name}" order by _account, id`,
    )
    return result.rows.map((row) => [row._account, row._account_name, row.id, row._pass])
  })
}

export type StoresOn = Awaited<ReturnType<typeof storesOn>>
