import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, post } from '../../hub/identity/test-hub.ts'
import { agentsOn, ordersOf, toolOf } from '../agents/test-agents.ts'

test('ferramenta em código: a rota de criar não a cria, kind CODE com source nasce uma pronta sem código (critério 6)', async (t) => {
  const on = await agentsOn(t)
  const made = await post(on.hub, on.ana, on.tools, {
    ...ordersOf(on.matriz, { slug: 'vendas_por_vendedor' }),
    kind: 'CODE',
    source: 'export default {}',
  })
  assert.equal(made.statusCode, 201, made.body)
  const tool = Object(toolOf(made))
  assert.deepEqual(
    [
      tool.kind,
      tool.versions.map((each: Record<string, unknown>) => [each.kind, 'source' in each]),
    ],
    ['PRESET', [['PRESET', false]]],
  )
  const listed = await call(on.hub, on.ana, 'GET', on.tools)
  assert.deepEqual(
    Object(listed.json()).tools.map((each: Record<string, unknown>) => each.kind),
    ['PRESET'],
  )
})
