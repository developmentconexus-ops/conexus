import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AgentId, CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { agentsOn, publishedAgent } from './test-agents.ts'

test('o Computador: uma versão publicada antes da chave abre com o Computador desligado, e a publicada com ele o traz ligado (18)', async (t) => {
  const on = await agentsOn(t)
  const old = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  const computer = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda.',
    machine: true,
  })
  await on.hub.test.asOwner(
    `update builder.agent_version set config = config - 'machine' where agent_id = $1`,
    [old.id],
  )
  const scope = {
    companyId: CompanyId.parse(on.companyId),
    projectId: ProjectId.parse(on.projectId),
    personId: PersonId.parse(on.ana.id),
  }
  assert.equal((await on.hub.agents.activeOf(scope, AgentId.parse(old.id)))?.machine, false)
  assert.equal((await on.hub.agents.activeOf(scope, AgentId.parse(computer.id)))?.machine, true)
})
