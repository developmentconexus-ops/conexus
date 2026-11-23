import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { CopyId, DataSources } from '@conexus/hub-api'
import { ConnectionId, ConversationId, OperationId, Role } from '@conexus/hub-api'
import type { DataWorld } from '@conexus/hub-api/conformance'
import { LAWS_AT } from '@conexus/hub-api/conformance'
import { Failure } from '../../platform/failure.ts'
import type { Place } from '../access/public.ts'
import { principalFor } from '../access/public.ts'
import { CopyDefinitionV2, TurnKey } from '../connectors/public.ts'
import {
  kitOf,
  linkMercadoLivre,
  linkSankhya,
  mercadoLivreServed,
  testOf,
} from '../connectors/test-connections.ts'
import { asSync } from '../copies/test-copies.ts'
import { doubleRows, plantCopy, plantRun } from '../copies/test-planted.ts'
import type { RolesWorld } from '../copies/test-readers.ts'
import { copyOf, idsOf, put, rolesWorld, VENDAS } from '../copies/test-readers.ts'
import { personOf } from '../identity/public.ts'
import { call } from '../identity/test-hub.ts'
import type { DataDeps } from './public.ts'
import { recordedData, sourcesFor } from './recorded.ts'
import { STORE_A, STORE_B } from './test-stores.ts'

/** What Bruno's role uses of the Sankhya: two reads a copy keeps, one read no copy keeps, and the order's write. */
const REACH = ['pedidos', 'notasFiscais', 'devolucoes', 'lancarPedido']
const OUTSIDE = 'fora_do_catalogo'

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

function planted(operation: string, input: Input) {
  return CopyDefinitionV2.parse({
    version: 2,
    source: { kind: 'OPERATION', operation, input },
    description: `As ${operation} do Sankhya`,
    columns: [{ name: 'codigo', type: 'bigint', path: 'codigo', description: 'O código' }],
    key: ['codigo'],
    changedSince: null,
  })
}

/** The Filial, a second Sankhya connection no copy reads. */
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

/** Releases the connections and the copies to the Projeto, as Ana. */
async function release(
  w: RolesWorld,
  connections: readonly ConnectionId[],
  copies: readonly CopyId[],
) {
  const { companyId, anaId, projectId } = w.on
  for (const connectionId of connections)
    await w.on.hub.connectors.grants.grant({
      companyId,
      person: { id: anaId },
      projectId,
      connectionId,
    })
  for (const copyId of copies)
    await w.on.copies.grant({ companyId, personId: anaId, projectId, copyId })
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

/** The company's world for Bruno, in Vendas: what the laws find in his catalog, at the company or in the Projeto. */
async function plantedWorld(t: TestContext, at: Place['kind']) {
  const ml = await mercadoLivreServed(t)
  const w = await rolesWorld(t, 'PLANTED', ml.change)
  for (const model of ['vendas', 'itens_venda']) {
    const copyId = copyOf(w.copies, `sankhya_${model}`)
    await plantRun(w.on, copyId, { outcome: 'PARTIAL', reason: 'CAP' }, doubleRows(model).length)
  }
  const { on } = w
  const role = `/api/companies/${on.companyId}/roles/${w.vendas.role}`
  const connectors = { sankhya: REACH, 'mercado-livre': ['pedidos', 'anuncios'] }
  const reach = await call(on.hub, on.ana, 'PUT', role, { connectors })
  assert.equal(reach.statusCode, 200, reach.body)
  const sankhya = await sankhyaKit(w)
  const pedidos = probeOf(sankhya, 'pedidos')
  const matriz = { connector: 'sankhya', connection: on.connectionId }
  const kept = await plantCopy(w.on, 'sankhya_pedidos_alfa', planted('pedidos', pedidos), matriz)
  const whole = await plantCopy(w.on, 'sankhya_devolucoes', planted('devolucoes', {}), matriz)
  if (at === 'PROJECT') {
    // A Sankhya is the Projeto's alone (project_connection_one_key); a Mercado Livre store is not.
    const [lojaA, lojaB] = await storesOf(w, ml.fake)
    assert.ok(lojaA && lojaB)
    const store = { connector: 'mercado-livre', connection: lojaA }
    const stores = kitOf('mercado-livre')
    const page = probeOf(stores, 'pedidos')
    const paged = await plantCopy(w.on, 'mercado_livre_pedidos', planted('pedidos', page), store)
    const marked = await put(w, on.ana, w.vendas.role, [...idsOf(w, VENDAS), paged, whole])
    assert.equal(marked.statusCode, 200, marked.body)
    const released = ['sankhya_vendas', 'sankhya_clientes'].map((name) => copyOf(w.copies, name))
    await release(w, [on.connectionId, lojaA, lojaB], [...released, paged, whole])
    // Vendas reads sankhya_produtos; the Projeto did not receive it.
    const outside = 'select count(*) from sync.sankhya_produtos'
    const another = [
      { ...page, status: 'paid' },
      { ...page, limit: 2 },
    ]
    // The read no copy keeps is the stores' anuncios.
    return { w, outside, inputs: { live: probeOf(stores, 'anuncios'), another } }
  }
  const marked = await put(w, on.ana, w.vendas.role, [...idsOf(w, VENDAS), kept, whole])
  assert.equal(marked.statusCode, 200, marked.body)
  await filialOf(w)
  await asSync(on.owner, async (client) => {
    await client.query(`create table sync.${OUTSIDE} as select 1 as n`)
    await client.query(`grant select on sync.${OUTSIDE} to "conexus_role_${w.vendas.id}"`)
  })
  const inputs = {
    live: probeOf(sankhya, 'notasFiscais'),
    another: [
      { ...pedidos, confirmada: true },
      { ...pedidos, page: 1 },
    ],
  }
  return { w, outside: `select n from sync.${OUTSIDE}`, inputs }
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
    async rows(a) {
      reached.signals.push(a.signal)
      reached.rows.push(a.table.name)
      const page = await sources.rows(a)
      gave.rows.push(page)
      return page
    },
    async live(a) {
      reached.signals.push(a.signal)
      reached.live.push({ connection: a.connection, operation: a.operation, input: a.input })
      const answer = await sources.live(a)
      gave.live.push(answer)
      return answer
    },
    async query(a) {
      reached.signals.push(a.signal)
      reached.query.push(a.sql)
      const answer = await sources.query(a)
      gave.query.push(answer)
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

/** The Hub's own deps for the data, with each part the world can stop. */
function depsOf(w: RolesWorld, down: Record<'catalog' | 'rows' | 'query', boolean>): DataDeps {
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
    copies: () => {
      const { tableRows, readers } = hub.copies.data
      return {
        tableRows: async (input) =>
          down.rows ? { kind: 'UNAVAILABLE', reason: 'DOWN' } : tableRows(input),
        readers: {
          ...readers,
          readAs: async (input) =>
            down.query ? { kind: 'UNAVAILABLE', cause: 'DOWN' } : readers.readAs(input),
        },
      }
    },
    ...{ projects: hub.projects.ports, connectors: () => hub.connectors },
  }
}

/**
 * The data track's sources over the test database and the Sankhya double: Bruno in Vendas asks in
 * `at`, in a conversation with a turn, and the contract is bound as the Hub binds it, with the Registro.
 */
export async function realWorld(t: TestContext, at: Place['kind']): Promise<DataWorld> {
  const { w, outside, inputs } = await plantedWorld(t, at)
  const { on } = w
  const place: Place =
    at === 'PROJECT' ? { kind: 'PROJECT', projectId: on.projectId } : { kind: 'COMPANY' }
  const principal = principalFor({
    ...{ consumer: 'assistant', companyId: on.companyId, personId: w.brunoId },
    ...{ place, choice: { kind: 'ANY' } },
  })
  const speaker = personOf(w.brunoId, Role.parse(w.vendas.role))
  const turn = { turn: TurnKey.parse(randomUUID()), speaker }
  const context = { thread: ConversationId.parse(randomUUID()), turn }
  const down = { catalog: false, rows: false, query: false }
  const deps = depsOf(w, down)
  const reached: Reached = { live: [], rows: [], funnel: [], query: [], signals: [] }
  const gave: Gave = { rows: [], live: [], funnel: [], query: [] }
  const sources = watched(sourcesFor(deps, principal, context), reached, gave)
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
    queries: {
      reads: 'select count(*) from sync.sankhya_vendas',
      outside,
      refused: 'select nao_existe from sync.sankhya_vendas',
    },
    inputs,
    hidden: { table: 'sankhya_clientes', query: 'select 1 from sync.sankhya_clientes' },
    down(part) {
      down[part] = true
    },
  }
}
