import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf, personOn } from '../../hub/identity/test-hub.ts'
import { agentsOn, drafted, madeAgent, savedCodeTool, toolOf } from '../agents/test-agents.ts'

test('apagar uma ferramenta em código: com a Cloudflare fora, TOOL_UNAVAILABLE e as linhas ficam; depois, os Workers de cada versão saem antes das linhas', async (t) => {
  const on = await agentsOn(t)
  const saved = await savedCodeTool(on, 1)
  const workers = saved.versions.map((version) => `t-${version.id}`).sort()
  assert.deepEqual(on.hub.tools.workers(), workers, 'one Worker per version')
  const url = `${on.tools}/${saved.id}`

  on.hub.tools.script('remove', 'NO_ANSWER')
  const refused = await call(on.hub, on.ana, 'DELETE', url)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'TOOL_UNAVAILABLE'])
  assert.equal((await call(on.hub, on.ana, 'GET', url)).statusCode, 200, 'nothing changed')

  const held = on.hub.tools.holdRemove()
  const deleting = call(on.hub, on.ana, 'DELETE', url)
  await held.arrived
  assert.equal(
    (await call(on.hub, on.ana, 'GET', url)).statusCode,
    200,
    'rows wait for the Workers',
  )
  held.release()
  assert.equal((await deleting).statusCode, 204)
  assert.deepEqual(on.hub.tools.workers(), [])
  const after = await call(on.hub, on.ana, 'GET', url)
  assert.deepEqual([after.statusCode, codeOf(after)], [404, 'TOOL_NOT_FOUND'])
})

test('apagar uma ferramenta em código: um rascunho que a escolhe enquanto os Workers saem recusa a remoção com TOOL_IN_USE, e o rascunho fica com ela', async (t) => {
  const on = await agentsOn(t)
  const saved = await savedCodeTool(on)
  const url = `${on.tools}/${saved.id}`
  const held = on.hub.tools.holdRemove()
  const deleting = call(on.hub, on.ana, 'DELETE', url)
  await held.arrived
  const made = await madeAgent(on.hub, on.ana, on.agents)
  await drafted(on.hub, on.ana, on.agents, made, { tools: [saved.latest.id] })
  held.release()
  const refused = await deleting
  assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'TOOL_IN_USE'])
  const still = toolOf(await call(on.hub, on.ana, 'GET', url))
  assert.deepEqual(still.usedBy, [{ id: made.id, projectId: on.projectId, name: 'Vendas do dia' }])
})

test('as ferramentas em código: remover a empresa tira os Workers delas; com a Cloudflare fora, CLIENT_DELETION_PENDING e a mesma rota termina', async (t) => {
  const on = await agentsOn(t)
  const saved = await savedCodeTool(on)
  const operator = await personOn(on.hub, {
    name: 'Olga Souza',
    email: 'olga@example.test',
    role: 'admin',
  })
  await on.hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, '00000000000001', 'Empresa Teste Ltda', $1, now())`,
    [on.companyId],
  )
  const client = `/api/clients/${on.companyId}`
  const body = { name: 'Empresa Teste', revision: 0 }
  on.hub.tools.script('remove', 'NO_ANSWER')
  const pending = await call(on.hub, operator, 'DELETE', client, body)
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'CLIENT_DELETION_PENDING'])
  assert.deepEqual(on.hub.tools.workers(), [`t-${saved.latest.id}`])
  const deleted = await call(on.hub, operator, 'DELETE', client, body)
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.deepEqual(on.hub.tools.workers(), [])
})
