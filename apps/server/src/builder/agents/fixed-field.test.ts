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
