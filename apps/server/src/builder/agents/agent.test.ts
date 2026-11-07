import assert from 'node:assert/strict'
import { test } from 'node:test'
import { said, talking } from '../assistant/test-assistant.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { madeTool, ordersOf, publishedAgent, talkedTo } from './test-agents.ts'
import { approving } from './test-approval.ts'

const READS_ONLY = /You only read: no tool of yours writes in a system/
const WRITES = /Some of your tools write in a system, and only those do/

test('o texto da escrita: a versão com uma escrita deixa de dizer que só lê e diz como a escrita espera; a versão só com leitura continua dizendo que só lê (12)', async (t) => {
  const on = await approving(t, [[said('Oi.')], [said('Oi.')]])
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const writer = await on.writer('ASK')
  const reader = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre os pedidos.',
    connections: [on.matriz],
    tools: [orders.latest.id],
  })
  for (const agent of [writer, reader]) {
    const { say } = await talking(
      t,
      on.hub,
      on.ana,
      await talkedTo(on.hub, on.ana, on.agents, agent.id),
    )
    assert.equal(endOf(await say('Oi')), 'complete')
  }
  const [toWriter, toReader] = on.calls.map((call) => call.system)
  assert.match(toWriter ?? '', WRITES)
  assert.doesNotMatch(toWriter ?? '', READS_ONLY)
  assert.match(toReader ?? '', READS_ONLY)
  assert.doesNotMatch(toReader ?? '', WRITES)
})
