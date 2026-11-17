import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { CatalogSystem } from '@conexus/hub-api'
import { Catalog, ConnectionId, OperationId } from '@conexus/hub-api'
import type { RolesWorld } from '../copies/test-readers.ts'
import { copyOf, put, rolesWorld, VENDAS } from '../copies/test-readers.ts'
import { call } from '../identity/test-hub.ts'
import type { Consumer, ConsumerContext } from './public.ts'
import { operationLeaf, principalFor, tableLeaf } from './public.ts'

type Scenario = Readonly<{
  /** The context Bruno converses in, for the consumer, as the conversation tells the door. */
  context: (w: RolesWorld) => Promise<ConsumerContext>
  revokedBy: readonly ('ROLE' | 'DECLARATION')[]
  /** Whether the role's marks decide his tables here (Empresa) or the Projeto's release does (P1). */
  tablesBy: 'ROLE' | 'RELEASE'
}>

/** The Projeto with the Sankhya and only `sankhya_vendas` released to it. */
async function released(w: RolesWorld) {
  const { companyId, anaId, projectId, connectionId } = w.on
  await w.on.hub.connectors.grants.grant({
    companyId,
    person: { id: anaId },
    projectId,
    connectionId,
  })
  await w.on.copies.grant({
    ...{ companyId, personId: anaId, projectId },
    copyId: copyOf(w.copies, 'sankhya_vendas'),
  })
  return projectId
}

function pedidos(w: RolesWorld) {
  return [{ connectionId: w.on.connectionId, operation: OperationId.parse('pedidos') }]
}

const SCENARIOS = {
  assistant: {
    context: async (w) => ({
      ...{ consumer: 'assistant', companyId: w.on.companyId, personId: w.brunoId },
      place: { kind: 'COMPANY' },
      choice: { kind: 'CHOSEN', connections: [w.on.connectionId] },
    }),
    revokedBy: ['ROLE'],
    tablesBy: 'ROLE',
  },
  builder: {
    context: async (w) => ({
      ...{ consumer: 'builder', companyId: w.on.companyId, personId: w.brunoId },
      projectId: await released(w),
    }),
    revokedBy: ['ROLE'],
    tablesBy: 'RELEASE',
  },
  construtor: {
    context: async (w) => ({
      ...{ consumer: 'construtor', companyId: w.on.companyId, personId: w.brunoId },
      projectId: await released(w),
    }),
    revokedBy: ['ROLE'],
    tablesBy: 'RELEASE',
  },
  agent: {
    context: async (w) => ({
      ...{ consumer: 'agent', companyId: w.on.companyId, personId: w.brunoId },
      place: { kind: 'PROJECT', projectId: await released(w) },
      declared: pedidos(w),
      choice: { kind: 'CHOSEN', connections: [w.on.connectionId] },
    }),
    revokedBy: ['ROLE', 'DECLARATION'],
    tablesBy: 'RELEASE',
  },
} satisfies Record<Consumer, Scenario>

async function describedIn(w: RolesWorld, context: ConsumerContext) {
  return Catalog.parse(await w.on.hub.data(principalFor(context), { thread: null }).describe())
}

function viewFor(w: RolesWorld, context: ConsumerContext) {
  return w.on.hub.access.viewOf(principalFor(context))
}

function operationsOf(systems: readonly CatalogSystem[]) {
  return systems.flatMap(({ connection, reads, actions }) =>
    [...reads.map((read) => ({ ...read, effect: 'READ' as const })), ...actions].map(
      ({ operation, effect }) => ({
        leaf: operationLeaf(connection, operation),
        operation,
        effect,
      }),
    ),
  )
}

/** Takes `pedidos` out of Bruno's reach as the scenario does, and the context to ask next. */
async function revoke(
  w: RolesWorld,
  path: Scenario['revokedBy'][number],
  context: ConsumerContext,
): Promise<ConsumerContext> {
  switch (path) {
    case 'ROLE': {
      const url = `/api/companies/${w.on.companyId}/roles/${w.vendas.role}`
      const changed = await call(w.on.hub, w.on.ana, 'PUT', url, { connectors: {} })
      assert.equal(changed.statusCode, 200, changed.body)
      return context
    }
    case 'DECLARATION': {
      assert.equal(context.consumer, 'agent')
      return { ...context, declared: [] }
    }
    default:
      return path satisfies never
  }
}

function names(systems: readonly CatalogSystem[]) {
  return operationsOf(systems).map(({ operation }) => operation)
}

for (const [consumer, scenario] of Object.entries(SCENARIOS)) {
  test(`lei (a): nada de fora do alcance aparece pelo nome, em ${consumer}`, async (t) => {
    const w = await rolesWorld(t, 'PLANTED')
    const context = await scenario.context(w)
    const described = await describedIn(w, context)
    assert.ok(!JSON.stringify(described).includes('sankhya_clientes'))
    assert.ok(!names(described.systems).includes('clientes'))
    const view = await viewFor(w, context)
    assert.deepEqual(described, {
      kind: 'CATALOG',
      systems: view.list('system'),
      tables: view.list('table'),
    })
  })

  test(`lei (b): o que a porta lista, a porta permite e a execução aceita, em ${consumer}`, async (t) => {
    const w = await rolesWorld(t, 'PLANTED')
    const context = await scenario.context(w)
    const view = await viewFor(w, context)
    const systems = view.list('system')
    const tables = view.list('table')
    assert.ok(systems.length > 0 && tables.length > 0, 'the scenario lists something')
    for (const { leaf, effect } of operationsOf(systems)) {
      assert.equal(view.may(leaf, effect).kind, 'ALLOWED', leaf)
    }
    for (const { name } of tables) {
      assert.equal(view.may(tableLeaf(name), 'READ').kind, 'ALLOWED', name)
    }
    const tools = await w.on.hub.connectors.assistant.connections(principalFor(context))
    const offered = new Set(
      tools.flatMap(({ connectionId, reads }) =>
        reads.map(({ operation }) => `${connectionId}:${operation}`),
      ),
    )
    for (const { connection, reads } of systems) {
      for (const { operation } of reads)
        assert.ok(offered.has(`${connection}:${operation}`), operation)
    }
    const data = w.on.hub.data(principalFor(context), { thread: null })
    for (const { name } of tables) {
      const read = await data.read({ kind: 'TABLE', table: name })
      assert.notEqual(read.kind, 'NOT_IN_CATALOG', name)
    }
    const outside = { kind: 'REFUSED', reason: 'OUT_OF_REACH' }
    assert.deepEqual(view.may(tableLeaf('sankhya_clientes'), 'READ'), outside)
    assert.deepEqual(view.may(operationLeaf(w.on.connectionId, 'clientes'), 'READ'), outside)
  })

  for (const path of scenario.revokedBy) {
    test(`lei (e) em ${consumer} (${path}): tirar pedidos muda a vista seguinte`, async (t) => {
      const w = await rolesWorld(t, 'PLANTED')
      const context = await scenario.context(w)
      const before = await viewFor(w, context)
      assert.ok(names(before.list('system')).includes('pedidos'))
      assert.ok(before.list('table').some(({ name }) => name === 'sankhya_vendas'))
      const after = await revoke(w, path, context)
      if (scenario.tablesBy === 'ROLE') {
        const kept = VENDAS.filter((name) => name !== 'sankhya_vendas').map((name) =>
          copyOf(w.copies, name),
        )
        const marked = await put(w, w.on.ana, w.vendas.role, kept)
        assert.equal(marked.statusCode, 200, marked.body)
      }
      const next = await viewFor(w, after)
      assert.ok(!names(next.list('system')).includes('pedidos'))
      assert.deepEqual(next.may(operationLeaf(w.on.connectionId, 'pedidos'), 'READ'), {
        kind: 'REFUSED',
        reason: 'OUT_OF_REACH',
      })
      const listed = next.list('table').some(({ name }) => name === 'sankhya_vendas')
      assert.equal(listed, scenario.tablesBy === 'RELEASE')
    })
  }
}

test('a escolha estreita os sistemas, não as tabelas: CHOSEN lista as escolhidas que a pessoa alcança, ANY todas as alcançadas', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const elsewhere = ConnectionId.parse(randomUUID())
  function assistant(choice: Extract<ConsumerContext, { consumer: 'assistant' }>['choice']) {
    return viewFor(w, {
      ...{ consumer: 'assistant', companyId: w.on.companyId, personId: w.brunoId },
      ...{ place: { kind: 'COMPANY' }, choice },
    })
  }
  const any = await assistant({ kind: 'ANY' })
  const chosen = await assistant({ kind: 'CHOSEN', connections: [w.on.connectionId, elsewhere] })
  const none = await assistant({ kind: 'CHOSEN', connections: [elsewhere] })
  assert.deepEqual(
    any.list('system').map(({ connection }) => connection),
    [w.on.connectionId],
  )
  assert.deepEqual(chosen.list('system'), any.list('system'))
  assert.deepEqual(none.list('system'), [])
  assert.ok(any.list('table').length > 0)
  assert.deepEqual(none.list('table'), any.list('table'))
  assert.deepEqual(chosen.list('table'), any.list('table'))
})
