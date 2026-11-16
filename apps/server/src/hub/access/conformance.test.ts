import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CatalogSystem } from '@conexus/hub-api'
import { Catalog, OperationId } from '@conexus/hub-api'
import type { SessionScope } from '../connectors/public.ts'
import type { RolesWorld } from '../copies/test-readers.ts'
import { copyOf, put, rolesWorld, VENDAS } from '../copies/test-readers.ts'
import { contextOf } from '../data/public.ts'
import { call } from '../identity/test-hub.ts'
import type { Consumer, ConsumerContext } from './public.ts'
import { operationLeaf, principalFor, tableLeaf } from './public.ts'

type Scenario = Readonly<{
  /** The scope Bruno converses in, for the consumer. */
  scope: (w: RolesWorld) => Promise<SessionScope>
  /** The context the door must be told for that scope, written by hand: contextOf must agree. */
  context: (w: RolesWorld) => Promise<ConsumerContext>
  /** What takes `pedidos` out of his reach: the role's route, or a version that does not declare it. */
  revokedBy: 'ROLE' | 'DECLARATION'
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
    scope: async (w) => ({
      companyId: w.on.companyId,
      personId: w.brunoId,
      place: { kind: 'COMPANY' },
      chosen: [],
    }),
    context: async (w) => ({
      consumer: 'assistant',
      companyId: w.on.companyId,
      personId: w.brunoId,
    }),
    revokedBy: 'ROLE',
    tablesBy: 'ROLE',
  },
  builder: {
    scope: async (w) => ({
      ...{ companyId: w.on.companyId, personId: w.brunoId, chosen: [] },
      place: { kind: 'PROJECT', projectId: await released(w) },
    }),
    context: async (w) => ({
      ...{ consumer: 'builder', companyId: w.on.companyId, personId: w.brunoId },
      projectId: w.on.projectId,
    }),
    revokedBy: 'ROLE',
    tablesBy: 'RELEASE',
  },
  agent: {
    scope: async (w) => ({
      ...{ companyId: w.on.companyId, personId: w.brunoId, chosen: [] },
      place: { kind: 'PROJECT', projectId: await released(w) },
      agentVersion: { kind: 'VERSION', declared: pedidos(w) },
    }),
    context: async (w) => ({
      ...{ consumer: 'agent', companyId: w.on.companyId, personId: w.brunoId },
      place: { kind: 'PROJECT', projectId: w.on.projectId },
      declared: pedidos(w),
    }),
    revokedBy: 'DECLARATION',
    tablesBy: 'RELEASE',
  },
} satisfies Record<Consumer, Scenario>

async function describedIn(w: RolesWorld, scope: SessionScope) {
  return Catalog.parse(await w.on.hub.data(scope).describe())
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
  scenario: Scenario,
  asked: Readonly<{ scope: SessionScope; context: ConsumerContext }>,
): Promise<ConsumerContext> {
  const { scope, context } = asked
  switch (scenario.revokedBy) {
    case 'ROLE': {
      const url = `/api/companies/${w.on.companyId}/roles/${w.vendas.role}`
      const changed = await call(w.on.hub, w.on.ana, 'PUT', url, { connectors: {} })
      assert.equal(changed.statusCode, 200, changed.body)
      return context
    }
    case 'DECLARATION': {
      const { companyId, personId } = context
      return { consumer: 'agent', companyId, personId, place: scope.place, declared: [] }
    }
    default:
      return scenario.revokedBy satisfies never
  }
}

function names(systems: readonly CatalogSystem[]) {
  return operationsOf(systems).map(({ operation }) => operation)
}

for (const [consumer, scenario] of Object.entries(SCENARIOS)) {
  test(`lei (a): nada de fora do alcance aparece pelo nome, em ${consumer}`, async (t) => {
    const w = await rolesWorld(t, 'PLANTED')
    const scope = await scenario.scope(w)
    const context = await scenario.context(w)
    const described = await describedIn(w, scope)
    assert.ok(!JSON.stringify(described).includes('sankhya_clientes'))
    assert.ok(!names(described.systems).includes('clientes'))
    assert.deepEqual(contextOf(scope), context)
    const view = await viewFor(w, context)
    assert.deepEqual(described, {
      kind: 'CATALOG',
      systems: view.list('system'),
      tables: view.list('table'),
    })
  })

  test(`lei (b): o que a porta lista, a porta permite e a execução aceita, em ${consumer}`, async (t) => {
    const w = await rolesWorld(t, 'PLANTED')
    const scope = await scenario.scope(w)
    const view = await viewFor(w, await scenario.context(w))
    const systems = view.list('system')
    const tables = view.list('table')
    assert.ok(systems.length > 0 && tables.length > 0, 'the scenario lists something')
    for (const { leaf, effect } of operationsOf(systems)) {
      assert.equal(view.may(leaf, effect).kind, 'ALLOWED', leaf)
    }
    for (const { name } of tables) {
      assert.equal(view.may(tableLeaf(name), 'READ').kind, 'ALLOWED', name)
    }
    const tools = await w.on.hub.connectors.assistant.connections(scope)
    const offered = new Set(
      tools.flatMap(({ connectionId, reads }) =>
        reads.map(({ operation }) => `${connectionId}:${operation}`),
      ),
    )
    for (const { connection, reads } of systems) {
      for (const { operation } of reads)
        assert.ok(offered.has(`${connection}:${operation}`), operation)
    }
    const data = w.on.hub.data(scope)
    for (const { name } of tables) {
      const read = await data.read({ kind: 'TABLE', table: name })
      assert.notEqual(read.kind, 'NOT_IN_CATALOG', name)
    }
    const outside = { kind: 'REFUSED', reason: 'OUT_OF_REACH' }
    assert.deepEqual(view.may(tableLeaf('sankhya_clientes'), 'READ'), outside)
    assert.deepEqual(view.may(operationLeaf(w.on.connectionId, 'clientes'), 'READ'), outside)
  })

  test(`lei (e): mudar o papel muda a vista seguinte, em ${consumer}`, async (t) => {
    const w = await rolesWorld(t, 'PLANTED')
    const scope = await scenario.scope(w)
    const context = await scenario.context(w)
    const before = await viewFor(w, context)
    assert.ok(names(before.list('system')).includes('pedidos'))
    assert.ok(before.list('table').some(({ name }) => name === 'sankhya_vendas'))
    const after = await revoke(w, scenario, { scope, context })
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
