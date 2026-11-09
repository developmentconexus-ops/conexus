import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { call, codeOf, post } from '../../hub/identity/test-hub.ts'
import { drafted, madeAgent } from './test-agents.ts'
import { approving } from './test-approval.ts'

function refusalOf(response: { statusCode: number; json(): unknown }) {
  const { code, field, reason } = Object(response.json())
  return [response.statusCode, code, field, reason]
}

const WRITE_TOOL = {
  slug: 'lancar_aberto',
  operation: 'lancarPedido',
  description: 'Lança um pedido de venda da empresa 1.',
}

test('o campo que só quem configura fixa: uma versão de Lançar pedido com notaModelo aberto, ou sem ela nos valores fixos, não cabe (TOOL_REFUSED, bound, NOT_FIXED), e uma que a fixa cabe (39)', async (t) => {
  const on = await approving(t, [])
  const base = { ...WRITE_TOOL, connectionId: on.matriz }
  const open = ['codigoCliente', 'itens']
  const bound = { notaModelo: 12, codigoLocalEstoque: 1 }
  const refusedOpen = await post(
    on.hub,
    on.ana,
    on.tools,
    { ...base, bound: { codigoLocalEstoque: 1 }, open: [...open, 'notaModelo'] },
    randomUUID(),
  )
  assert.deepEqual(refusalOf(refusedOpen), [422, 'TOOL_REFUSED', 'bound', 'NOT_FIXED'])
  const refusedBare = await post(
    on.hub,
    on.ana,
    on.tools,
    { ...base, bound: { codigoLocalEstoque: 1 }, open },
    randomUUID(),
  )
  assert.deepEqual(refusalOf(refusedBare), [422, 'TOOL_REFUSED', 'bound', 'NOT_FIXED'])
  const fixed = await post(on.hub, on.ana, on.tools, { ...base, bound, open }, randomUUID())
  assert.equal(fixed.statusCode, 201, fixed.body)
})

test('a escrita sem o valor fixo: publicar um agente cuja versão da ferramenta deixa notaModelo aberto é recusado com NOT_FIXED, sem publicar', async (t) => {
  const on = await approving(t, [])
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const draft = await drafted(on.hub, on.ana, on.agents, made, {
    instructions: 'Lance os pedidos.',
    connections: [on.matriz],
    tools: [on.write.latest.id],
    approvals: { [on.write.id]: 'ASK' },
  })
  // A version saved before the field was declared fixed: the library refuses to save one now.
  await on.hub.test.asOwner(
    `update builder.tool_version set config = jsonb_set(jsonb_set(config, '{bound}', (config->'bound') - 'notaModelo'), '{open}', (config->'open') || '["notaModelo"]'::jsonb) where tool_id = $1`,
    [on.write.id],
  )
  const published = await post(on.hub, on.ana, `${on.agents}/${draft.id}/publish`, {
    revision: draft.revision,
    message: '',
  })
  assert.deepEqual(refusalOf(published), [422, 'AGENT_TOOL_REFUSED', 'tools', 'NOT_FIXED'])
  assert.deepEqual(codeOf(published), 'AGENT_TOOL_REFUSED')
  assert.deepEqual(await on.hub.test.asOwner('select 1 from builder.agent_version'), [])
  const read = await call(on.hub, on.ana, 'GET', `${on.agents}/${draft.id}`)
  assert.equal(Object(read.json()).agent.activeVersion ?? null, null)
})

test('a escrita pronta não abre a nota modelo: a versão gravada tem o notaModelo fora de open, e uma versão nova com ele nos valores fixos cabe', async (t) => {
  const on = await approving(t, [])
  const made = await madeAgent(on.hub, on.ana, on.agents)
  await drafted(on.hub, on.ana, on.agents, made, {
    ready: [{ connectionId: on.matriz, operation: 'lancarPedido' }],
  })
  const listed = await call(on.hub, on.ana, 'GET', on.tools)
  const ready = Object(listed.json()).tools.find(
    (each: { operation: string; slug: string }) =>
      each.operation === 'lancarPedido' && each.slug !== 'lancar_pedido',
  )
  assert.ok(ready, 'the ready write is in the library')
  const detail = Object((await call(on.hub, on.ana, 'GET', `${on.tools}/${ready.id}`)).json()).tool
  const [first] = detail.versions
  assert.ok(first.open.length > 0)
  assert.equal(first.open.includes('notaModelo'), false)
  const next = await post(
    on.hub,
    on.ana,
    `${on.tools}/${ready.id}/versions`,
    {
      description: first.description,
      bound: { notaModelo: 12, codigoLocalEstoque: 1 },
      open: first.open.filter((field: string) => field !== 'codigoLocalEstoque'),
      basedOn: detail.latest.number,
    },
    randomUUID(),
  )
  assert.equal(next.statusCode, 201, next.body)
})
