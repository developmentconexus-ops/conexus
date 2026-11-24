import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { DataSources } from '@conexus/hub-api'
import { ConnectionId, ConversationId, OperationId, Role } from '@conexus/hub-api'
import type { DataWorld } from '@conexus/hub-api/conformance'
import { LAWS_AT } from '@conexus/hub-api/conformance'
import { Failure } from '../../platform/failure.ts'
import type { Place } from '../access/public.ts'
import { principalFor } from '../access/public.ts'
import { TurnKey } from '../connectors/public.ts'
import {
  kitOf,
  linkMercadoLivre,
  linkSankhya,
  mercadoLivreServed,
  testOf,
} from '../connectors/test-connections.ts'
import { personOf } from '../identity/public.ts'
import { call } from '../identity/test-hub.ts'
import type { DataDeps } from './public.ts'
import { recordedData, sourcesFor } from './recorded.ts'
import type { RolesWorld } from './test-company.ts'
import { rolesWorld } from './test-company.ts'
import { STORE_A, STORE_B } from './test-stores.ts'

/** What Bruno's role uses of the Sankhya: three reads and the order's write. */
const REACH = ['pedidos', 'notasFiscais', 'devolucoes', 'lancarPedido']

type Input = Readonly<Record<string, unknown>>

/** The input a kit's probe declares for a read. */
function probeOf(kit: ReadonlyMap<string, unknown>, operation: string): Input {
  const input = kit.get(operation)
  assert.ok(typeof input === 'object' && input !== null, `the kit's probe of ${operation}`)
  return { ...input }
}

/** The Sankhya kit's probes, its sales reads chained on the `empresas` the Matriz answers Ana. */
async function sankhyaKit(w: RolesWorld) {
  const { on } = w
  const ana = principalFor({
    ...{ consumer: 'assistant', companyId: on.companyId, personId: on.anaId },
    ...{ place: { kind: 'COMPANY' }, choice: { kind: 'ANY' } },
  })
  const empresas = await on.hub.connectors.assistant.read(ana, {
    ...{ connectionId: on.connectionId, operation: 'empresas' },
    ...{ input: probeOf(kitOf('sankhya'), 'empresas'), turn: TurnKey.parse(randomUUID()) },
  })
  assert.ok(empresas.kind === 'OK', JSON.stringify(empresas))
  return kitOf('sankhya', new Map([[OperationId.parse('empresas'), empresas.whole]]))
}

/** The Filial, a second Sankhya connection. */
async function filialOf(w: RolesWorld) {
  const { on } = w
  const linked = await linkSankhya(
    on.hub,
    on.ana,
    on.connections,
    on.fake.credential,
    undefined,
    'Filial',
  )
  assert.equal(linked.statusCode, 201, linked.body)
  const id = ConnectionId.parse(Object(linked.json()).connection.id)
  assert.equal(
    Object((await testOf(on.hub, on.ana, on.connections, id)).json()).connection?.state,
    'ACTIVE',
  )
  return id
}

/** Two Mercado Livre stores of the company, linked and tested by Ana: a Projeto may receive several. */
async function storesOf(
  w: RolesWorld,
  fake: Awaited<ReturnType<typeof mercadoLivreServed>>['fake'],
) {
  const stores: ConnectionId[] = []
  for (const [at, store] of [STORE_A, STORE_B].entries()) {
    fake.switches.account = store
    const name = `Loja ${String.fromCharCode(65 + at)}`
    const linked = await linkMercadoLivre(w.on.hub, w.on.ana, w.on.companyId, {
      ...{ connector: 'mercado-livre', name },
    })
    assert.equal(Object(linked.json()).result, 'LINKED', linked.body)
    const id = ConnectionId.parse(Object(linked.json()).connection.id)
    const tested = await testOf(w.on.hub, w.on.ana, w.on.connections, id)
    assert.equal(Object(tested.json()).connection?.state, 'ACTIVE', tested.body)
    stores.push(id)
  }
  return stores
}

/** The company's world for Bruno, in Vendas: his role reaches the Sankhya and the Mercado Livre; a Projeto is granted the Sankhya and both stores. */
async function companyWorld(t: TestContext, at: Place['kind']) {
  const ml = await mercadoLivreServed(t)
  const w = await rolesWorld(t, ml.change)
  const { on } = w
  const role = `/api/companies/${on.companyId}/roles/${w.vendas}`
  const connectors = { sankhya: REACH, 'mercado-livre': ['pedidos', 'anuncios'] }
  const reach = await call(on.hub, on.ana, 'PUT', role, { connectors })
  assert.equal(reach.statusCode, 200, reach.body)
  const sankhya = await sankhyaKit(w)
  if (at === 'PROJECT') {
    // A Sankhya is the Projeto's alone (project_connection_one_key); a Mercado Livre store is not.
    const [lojaA, lojaB] = await storesOf(w, ml.fake)
    assert.ok(lojaA && lojaB)
    for (const connectionId of [on.connectionId, lojaA, lojaB])
      await on.hub.connectors.grants.grant({
        ...{ companyId: on.companyId, person: { id: on.anaId } },
        ...{ projectId: on.projectId, connectionId },
      })
  } else await filialOf(w)
  return { w, kits: { sankhya, 'mercado-livre': kitOf('mercado-livre') } }
}

type Reached = DataWorld['reached']
type Gave = DataWorld['gave']

/** Each source as the contract calls it, with what it reached and what it answered. */
function watched(sources: DataSources, reached: Reached, gave: Gave): DataSources {
  return {
    async catalog(a) {
      reached.signals.push(a.signal)
      return sources.catalog(a)
    },
    async live(a) {
      reached.signals.push(a.signal)
      reached.live.push({ connection: a.connection, operation: a.operation, input: a.input })
      const answer = await sources.live(a)
      gave.live.push(answer)
      return answer
    },
    async funnel(a) {
      reached.signals.push(a.signal)
      const { connection, operation, input, call: asked } = a
      reached.funnel.push({ connection, operation, input, call: asked })
      const answer = await sources.funnel(a)
      gave.funnel.push(answer)
      return answer
    },
  }
}

const DOWN = new Failure('DATABASE_UNAVAILABLE')

/** The Hub's own deps for the data, with the access door the world can stop. */
function depsOf(w: RolesWorld, down: { catalog: boolean }): DataDeps {
  const { hub } = w.on
  function line(fields: Record<string, unknown>, message: string) {
    hub.lines.push({ fields, message })
  }
  return {
    ...{ database: hub.test.database, identity: hub.identity, log: { info: line, error: line } },
    access: {
      viewOf: async (principal) => {
        if (down.catalog) throw DOWN
        return hub.access.viewOf(principal)
      },
    },
    ...{ projects: hub.projects.ports, connectors: () => hub.connectors },
  }
}

/** The input the kit's probe declares for the first read in the world's own catalog. */
async function liveInputOf(
  sources: DataSources,
  kits: Readonly<Record<string, ReadonlyMap<string, unknown>>>,
) {
  const described = await sources.catalog({})
  assert.ok(described.kind === 'CATALOG', JSON.stringify(described))
  const system = described.systems.find((one) => one.reads.length > 0)
  const [read] = system?.reads ?? []
  const kit = system && kits[system.connector]
  assert.ok(system && read && kit, 'a system with a read the kit probes')
  return probeOf(kit, read.operation)
}

/**
 * The data track's sources over the test database and the Sankhya double: Bruno in Vendas asks in
 * `at`, in a conversation with a turn, and the contract is bound as the Hub binds it, with the Registro.
 */
export async function realWorld(t: TestContext, at: Place['kind']): Promise<DataWorld> {
  const { w, kits } = await companyWorld(t, at)
  const { on } = w
  const place: Place =
    at === 'PROJECT' ? { kind: 'PROJECT', projectId: on.projectId } : { kind: 'COMPANY' }
  const principal = principalFor({
    ...{ consumer: 'assistant', companyId: on.companyId, personId: w.brunoId },
    ...{ place, choice: { kind: 'ANY' } },
  })
  const speaker = personOf(w.brunoId, Role.parse(w.vendas))
  const turn = { turn: TurnKey.parse(randomUUID()), speaker }
  const context = { thread: ConversationId.parse(randomUUID()), turn }
  const down = { catalog: false }
  const deps = depsOf(w, down)
  const reached: Reached = { live: [], funnel: [], signals: [] }
  const gave: Gave = { live: [], funnel: [] }
  const bound = sourcesFor(deps, principal, context)
  const liveInput = await liveInputOf(bound, kits)
  const sources = watched(bound, reached, gave)
  return {
    sources,
    data: recordedData(deps, principal, context, sources, () => LAWS_AT),
    reads: () =>
      on.hub.test.asOwner('select * from data.data_read where company_id = $1 order by at, id', [
        on.companyId,
      ]),
    // The Registro's insert fails as a database that went away, for the contract's rows and readThrough's alike.
    async failRecord() {
      await on.hub.test.asOwner(`create function data.refuse_read() returns trigger language plpgsql as $$
        begin raise exception 'down' using errcode = '57P01'; end $$`)
      await on.hub.test.asOwner(
        'create trigger refuse before insert on data.data_read for each row execute function data.refuse_read()',
      )
    },
    reached,
    gave,
    liveInput,
    down() {
      down.catalog = true
    },
  }
}
