import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import { said } from '../assistant/test-assistant.ts'
import { drafted, madeAgent, publishedNow } from './test-agents.ts'
import { approving, launched } from './test-approval.ts'

test('a escrita que faz sozinha pelo Desenvolvedor com a ação (D1-a): com a linha da empresa grava e publica em Faz sozinho; tirada a linha, recusa de novo (9)', async (t) => {
  const on = await approving(t, [[launched()], [said('Lançado.')]])
  const dora = await memberOn(
    on.hub,
    on.companyId,
    { name: 'Dora Reis', email: 'dora@example.test' },
    'developer',
  )
  const reads = ['clientes', 'empresas', 'pedidos', 'consultar', 'carregar']
  function setRole(unattended: boolean) {
    return call(on.hub, on.ana, 'PUT', `${on.company}/roles/developer`, {
      connectors: { sankhya: [...reads, 'lancarPedido'] },
      unattended,
    })
  }
  assert.equal((await setRole(true)).statusCode, 200)
  const made = await madeAgent(on.hub, dora, on.agents)
  const alone = await drafted(on.hub, dora, on.agents, made, {
    ...{ instructions: 'Lance os pedidos.', connections: [on.matriz], tools: [on.write.latest.id] },
    approvals: { [on.write.id]: 'AUTO' },
  })
  assert.deepEqual((await publishedNow(on.hub, dora, on.agents, alone)).state, {
    kind: 'PUBLISHED',
    version: 1,
    changed: false,
  })
  assert.equal((await setRole(false)).statusCode, 200)
  const again = await drafted(on.hub, on.ana, on.agents, alone, { instructions: 'Lance.' })
  const refused = await post(on.hub, dora, `${on.agents}/${made.id}/publish`, {
    revision: again.revision,
    message: '',
  })
  assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'NOT_IN_ROLE'], refused.body)
})
