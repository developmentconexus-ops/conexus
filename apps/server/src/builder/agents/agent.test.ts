import assert from 'node:assert/strict'
import { test } from 'node:test'
import { said, talking } from '../assistant/test-assistant.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { madeTool, ordersOf, publishedAgent, talkedTo } from './test-agents.ts'
import { approving } from './test-approval.ts'
import { approvingOnOpenai } from './test-openai-agent.ts'

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

test('a leitura recusada: a leitura que o sistema recusa termina em erro com o texto inteiro, e o modelo a recebe como falha; uma leitura que dá certo não muda', async (t) => {
  const on = await approving(t, [
    [tool('tool_pedidos_matriz', { page: 1 })],
    [said('Não li.')],
    [tool('tool_pedidos_matriz', { page: 1 })],
    [said('Li.')],
  ])
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const reader = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre os pedidos.',
    connections: [on.matriz],
    tools: [orders.latest.id],
  })
  const url = await talkedTo(on.hub, on.ana, on.agents, reader.id)
  const { say } = await talking(t, on.hub, on.ana, url)
  on.fake.switches.refuse.add('pedidos')
  assert.equal(endOf(await say('Quais os pedidos?')), 'complete')
  const [failed] = on.calls[1]?.toolResults ?? []
  assert.equal(failed?.error, true)
  const told = JSON.parse(failed?.text ?? '')
  assert.equal(told.kind, 'REFUSED')
  assert.equal(told.status, 403)
  assert.equal(typeof told.message, 'string')
  assert.notEqual(told.body, null, 'the system’s whole answer comes with it')

  on.fake.switches.refuse.delete('pedidos')
  assert.equal(endOf(await say('E agora?')), 'complete')
  const [read] = on.calls[3]?.toolResults.slice(-1) ?? []
  assert.equal(read?.error, false)
  assert.equal(JSON.parse(read?.text ?? '').kind, 'OK')
})

test('a leitura recusada no OpenAI: o stream gravado da assinatura ChatGPT chama a leitura, ela termina em erro com o texto inteiro, e a function_call_output do pedido seguinte o leva (36)', async (t) => {
  const on = await approvingOnOpenai(t, [
    'openai-refused-read-call',
    'openai-refused-write-closing',
  ])
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const reader = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre os pedidos.',
    connections: [on.matriz],
    tools: [orders.latest.id],
  })
  const url = await talkedTo(on.hub, on.ana, on.agents, reader.id)
  const { say } = await talking(t, on.hub, on.ana, url)
  on.fake.switches.refuse.add('pedidos')
  const events = await say('Quais os pedidos?')
  assert.equal(endOf(events), 'complete', 'the turn goes on after the failure')
  const ended = events.find((event) => event.type === 'tool_end')
  assert.equal(Reflect.get(ended ?? {}, 'isError'), true)
  const [output, ...others] = on.outputs()
  assert.deepEqual(others, [])
  assert.ok(String(output?.output).startsWith('{"kind":"REFUSED"'))
  const told = JSON.parse(output?.output ?? '')
  assert.equal(told.status, 403)
  assert.equal(typeof told.message, 'string')
  assert.notEqual(told.body, null, 'the system’s whole answer comes with it')
  assert.deepEqual(Object.keys(output ?? {}).sort(), ['call_id', 'output', 'type'])
})
