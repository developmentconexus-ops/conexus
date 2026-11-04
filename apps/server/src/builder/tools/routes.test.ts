import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { call, codeOf, plantCompany, post } from '../../hub/identity/test-hub.ts'
import type { Tool } from '../agents/test-agents.ts'
import {
  agentOf,
  agentsOn,
  drafted,
  madeAgent,
  madeTool,
  ordersOf,
  otherProject,
  plantedTool,
  toolOf,
} from '../agents/test-agents.ts'

function refusalOf(response: { statusCode: number; json(): unknown }) {
  const { code, field, reason } = Object(response.json())
  return [response.statusCode, code, field, reason]
}

function listOf(response: { json(): unknown }): {
  tools: Tool[]
  ready: { operation: string; label: string; slug: string; connectionId: string }[]
} {
  return Object(response.json())
}

test('gravar: a versão 1 nasce com a ferramenta; a mesma chave dá a mesma; cada recusa diz o campo e o motivo', async (t) => {
  const on = await agentsOn(t)
  const key = randomUUID()
  const body = ordersOf(on.matriz)
  const [first, second] = await Promise.all([
    post(on.hub, on.ana, on.tools, body, key),
    post(on.hub, on.ana, on.tools, body, key),
  ])
  assert.equal(first.statusCode, 201, first.body)
  assert.equal(second.statusCode, 201, second.body)
  const tool = toolOf(first)
  assert.equal(toolOf(second).id, tool.id)
  assert.deepEqual(
    {
      ...tool,
      id: '',
      latest: tool.latest.number,
      versions: tool.versions?.map((each) => each.number),
    },
    {
      ...{ id: '', slug: 'pedidos_matriz', connectionId: on.matriz, operation: 'pedidos' },
      ...{ description: body.description, effect: 'READ', latest: 1, usedBy: [], versions: [1] },
      ...{ connectionName: 'Matriz', readLabel: 'Pedidos' },
    },
  )
  const other = await post(on.hub, on.ana, on.tools, { ...body, description: 'Outra.' }, key)
  assert.deepEqual([other.statusCode, codeOf(other)], [409, 'IDEMPOTENCY_CONFLICT'])

  const refusals = [
    [{ operation: 'apagarPedido' }, 'operation', 'NOT_A_READ'],
    [{ connectionId: on.filial }, 'connectionId', 'NOT_OFFERED'],
    [{ bound: { codigoEmpresa: 'um' } }, 'bound', 'VALUE_REFUSED'],
    [{ bound: { empresa: 1 } }, 'bound', 'UNKNOWN_FIELD'],
    [{ open: ['codigoEmpresa', 'page'] }, 'open', 'FIELD_TWICE'],
    [{ open: ['dataNegociacaoInicio'] }, 'open', 'REQUIRED_MISSING'],
    [{}, 'slug', 'SLUG_TAKEN'],
  ] as const
  for (const [change, field, reason] of refusals) {
    const refused = await post(on.hub, on.ana, on.tools, ordersOf(on.matriz, change))
    assert.deepEqual(refusalOf(refused), [422, 'TOOL_REFUSED', field, reason])
  }
})

test('listar: a lista traz as da biblioteca com a ligação e a leitura por nome, e as prontas; o Projeto sem a ligação não a vê', async (t) => {
  const on = await agentsOn(t)
  const tool = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const library = listOf(await call(on.hub, on.ana, 'GET', on.tools))
  assert.deepEqual(
    library.tools.map((each) => [
      each.slug,
      each.latest.number,
      each.connectionName,
      each.readLabel,
    ]),
    [['pedidos_matriz', 1, 'Matriz', 'Pedidos']],
  )
  assert.equal(
    library.ready.some((each) => each.operation === 'pedidos'),
    true,
  )
  assert.equal(
    library.ready.every((each) => each.connectionId === on.matriz),
    true,
  )
  const clientes = library.ready.find((each) => each.operation === 'clientes')
  assert.equal(clientes?.slug, `clientes_${on.matriz.slice(0, 6)}`)
  assert.equal(clientes?.label, 'Clientes')
  const vendas = await otherProject(on.hub, on.ana, on.company, [on.matriz])
  const theirs = listOf(await call(on.hub, on.ana, 'GET', vendas.tools))
  assert.deepEqual(
    theirs.tools.map((each) => each.id),
    [tool.id],
  )
  const bare = await otherProject(on.hub, on.ana, on.company, [], 'Compras')
  assert.deepEqual(listOf(await call(on.hub, on.ana, 'GET', bare.tools)), { tools: [], ready: [] })
})

test('listar: uma leitura que saiu do kit mostra o id dela no lugar do nome, e a lista continua', async (t) => {
  const on = await agentsOn(t)
  const toolId = randomUUID()
  await on.hub.test.asOwner(
    `insert into builder.tool (id, company_id, connection_id, operation, slug, body_hash)
      values ($1, $2, $3, 'removida', 'removida_matriz', 'plantada')`,
    [toolId, on.companyId, on.matriz],
  )
  await on.hub.test.asOwner(
    `insert into builder.tool_version (id, tool_id, company_id, number, config, body_hash)
      values ($1, $2, $3, 1, $4, 'plantada')`,
    [
      randomUUID(),
      toolId,
      on.companyId,
      JSON.stringify({ description: 'Antiga.', bound: {}, open: [] }),
    ],
  )
  const library = listOf(await call(on.hub, on.ana, 'GET', on.tools))
  assert.deepEqual(
    library.tools.map((each) => [each.operation, each.readLabel]),
    [['removida', 'removida']],
  )
})

test('versões: a nova é n+1 e as anteriores não mudam; a mesma chave dá a mesma; duas ao mesmo tempo dão 2 e 3; uma versão que não cabe na operação, TOOL_REFUSED', async (t) => {
  const on = await agentsOn(t)
  const tool = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const url = `${on.tools}/${tool.id}/versions`
  const key = randomUUID()
  const v2 = {
    description: 'Os pedidos da empresa 2.',
    bound: { codigoEmpresa: 2 },
    open: ['page'],
  }
  const made = await post(on.hub, on.ana, url, v2, key)
  assert.equal(made.statusCode, 201, made.body)
  const again = await post(on.hub, on.ana, url, v2, key)
  assert.equal(again.statusCode, 201, again.body)
  assert.deepEqual(toolOf(again), toolOf(made))
  const conflict = await post(on.hub, on.ana, url, { ...v2, description: 'Outra.' }, key)
  assert.deepEqual([conflict.statusCode, codeOf(conflict)], [409, 'IDEMPOTENCY_CONFLICT'])
  await Promise.all([post(on.hub, on.ana, url, v2), post(on.hub, on.ana, url, v2)])
  const read = toolOf(await call(on.hub, on.ana, 'GET', `${on.tools}/${tool.id}`))
  assert.deepEqual(
    read.versions?.map(({ number, description, bound }) => [number, description, bound]),
    [
      [1, ordersOf(on.matriz).description, { codigoEmpresa: 1 }],
      [2, v2.description, { codigoEmpresa: 2 }],
      [3, v2.description, { codigoEmpresa: 2 }],
      [4, v2.description, { codigoEmpresa: 2 }],
    ],
  )
  assert.deepEqual(
    [read.latest.number, read.slug, read.operation],
    [4, 'pedidos_matriz', 'pedidos'],
  )
  const refused = await post(on.hub, on.ana, url, { ...v2, open: [] })
  assert.deepEqual(refusalOf(refused), [422, 'TOOL_REFUSED', 'open', 'REQUIRED_MISSING'])
})

test('apagar: sem uso, 204; usada por um rascunho ou por uma versão publicada, TOOL_IN_USE com os nomes e nada muda; de outra empresa ou de uma ligação que o Projeto não recebeu, TOOL_NOT_FOUND', async (t) => {
  const on = await agentsOn(t)
  const loose = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz, { slug: 'solta' }))
  const gone = await call(on.hub, on.ana, 'DELETE', `${on.tools}/${loose.id}`)
  assert.equal(gone.statusCode, 204, gone.body)
  const after = await call(on.hub, on.ana, 'GET', `${on.tools}/${loose.id}`)
  assert.deepEqual([after.statusCode, codeOf(after)], [404, 'TOOL_NOT_FOUND'])

  const tool = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const chosen = await drafted(on.hub, on.ana, on.agents, made, {
    instructions: 'Os pedidos do dia.',
    tools: [tool.latest.id],
  })
  const used = await call(on.hub, on.ana, 'DELETE', `${on.tools}/${tool.id}`)
  assert.deepEqual([used.statusCode, codeOf(used)], [409, 'TOOL_IN_USE'])
  assert.deepEqual(Object(used.json()).agents, [{ id: made.id, name: 'Vendas do dia' }])
  const published = await post(on.hub, on.ana, `${on.agents}/${made.id}/publish`, {
    revision: chosen.revision,
    message: '',
  })
  assert.equal(published.statusCode, 200, published.body)
  await drafted(on.hub, on.ana, on.agents, agentOf(published), { tools: [] })
  const pinned = await call(on.hub, on.ana, 'DELETE', `${on.tools}/${tool.id}`)
  assert.deepEqual([pinned.statusCode, codeOf(pinned)], [409, 'TOOL_IN_USE'])
  const still = toolOf(await call(on.hub, on.ana, 'GET', `${on.tools}/${tool.id}`))
  assert.deepEqual(still.usedBy, [{ id: made.id, name: 'Vendas do dia' }])

  const elsewhere = await plantCompany(on.hub.test, on.ana.id, 'Outra Empresa')
  const foreign = await plantedTool(on.hub, elsewhere, on.matriz)
  const bare = await otherProject(on.hub, on.ana, on.company, [])
  const v2 = { description: 'Outra.', bound: {}, open: ['codigoEmpresa', 'page'] }
  for (const url of [`${on.tools}/${foreign.toolId}`, `${bare.tools}/${tool.id}`]) {
    const asked = [
      await call(on.hub, on.ana, 'GET', url),
      await post(on.hub, on.ana, `${url}/versions`, v2),
      await call(on.hub, on.ana, 'DELETE', url),
    ]
    assert.deepEqual(
      asked.map((each) => [each.statusCode, codeOf(each)]),
      asked.map(() => [404, 'TOOL_NOT_FOUND']),
    )
  }
})
