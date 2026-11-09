import assert from 'node:assert/strict'
import { test } from 'node:test'
import { said } from '../assistant/test-assistant.ts'
import { endOf, hubBeside, sent, streamOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { talkedTo } from './test-agents.ts'
import { ASKED, approving, launched, WRITE } from './test-approval.ts'
import { approvingOnOpenai } from './test-openai-agent.ts'

const UNKNOWN_PRODUCT = {
  ...ASKED,
  itens: [{ codigoProduto: 999, quantidade: 1, valorUnitario: 10 }],
}
const REFUSAL = {
  kind: 'REFUSED',
  status: 400,
  code: 'BAD_REQUEST',
  message: 'Ocorreu algum erro inesperado! O produto [999] enviado não existe.',
  body: {
    statusCode: 400,
    error: {
      code: 'BAD_REQUEST',
      message: 'Ocorreu algum erro inesperado!',
      details: 'O produto [999] enviado não existe.',
    },
  },
}

test('a recusa chega inteira ao modelo: a escrita recusada termina em erro com o JSON inteiro, e o pedido seguinte leva o texto como falha, sem a causa no log (34)', async (t) => {
  const on = await approving(t, [[tool(WRITE, UNKNOWN_PRODUCT)], [said('Não lancei.')]])
  const agent = await on.writer('AUTO')
  const { url, stream } = await on.opened(agent.id)
  await sent(on.hub, on.ana, url, 'Lance o pedido do produto 999')
  const events = await stream.turn()
  assert.equal(endOf(events), 'complete', 'the turn goes on after the failure')
  const ended = events.find((event) => event.type === 'tool_end')
  assert.equal(Reflect.get(ended ?? {}, 'isError'), true)
  const [result] = on.calls[1]?.toolResults ?? []
  assert.equal(result?.error, true)
  assert.deepEqual(JSON.parse(result?.text ?? ''), REFUSAL)
  const [row] = await on.hub.test.asOwner('select state, answer from connectors.connector_write')
  assert.equal(row?.state, 'REFUSED')
  loggedWithoutCause(on.hub.lines)
})

/** The refusal and Mastra's error are logged with scalars only, and the cause is in no line (S41). */
function loggedWithoutCause(lines: { fields: Record<string, unknown>; message: string }[]) {
  const logged = lines.filter(
    (line) => line.message === 'MASTRA_ERROR' || line.message === 'CONNECTOR_WRITE_REFUSED',
  )
  assert.ok(logged.some((line) => line.message === 'CONNECTOR_WRITE_REFUSED'))
  assert.ok(logged.some((line) => line.message === 'MASTRA_ERROR'))
  for (const line of logged) {
    for (const value of Object.values(line.fields)) {
      assert.ok(['string', 'number', 'boolean'].includes(typeof value))
    }
  }
  assert.doesNotMatch(JSON.stringify(lines), /não existe|BAD_REQUEST|statusCode/)
}

test('a recusa chega inteira ao OpenAI: o stream gravado da assinatura ChatGPT chama a escrita, ela termina em erro, e a function_call_output do pedido seguinte leva o texto inteiro, que começa pelo kind, sem marca de erro (34)', async (t) => {
  const on = await approvingOnOpenai(t, [
    'openai-refused-write-call',
    'openai-refused-write-closing',
  ])
  const agent = await on.writer('AUTO')
  const { url, stream } = await on.opened(agent.id)
  await sent(on.hub, on.ana, url, 'Lance o pedido do produto 999')
  const events = await stream.turn()
  assert.equal(endOf(events), 'complete', 'the turn goes on after the failure')
  const ended = events.find((event) => event.type === 'tool_end')
  assert.equal(Reflect.get(ended ?? {}, 'isError'), true)
  const [output, ...others] = on.outputs()
  assert.deepEqual(others, [])
  assert.ok(String(output?.output).startsWith('{"kind":"REFUSED"'))
  assert.deepEqual(JSON.parse(output?.output ?? ''), REFUSAL)
  assert.deepEqual(Object.keys(output ?? {}).sort(), ['call_id', 'output', 'type'])
  const [row] = await on.hub.test.asOwner('select state from connectors.connector_write')
  assert.equal(row?.state, 'REFUSED')
  loggedWithoutCause(on.hub.lines)
})

test('o que lança e o que responde: a escrita sem resposta volta como resultado com a instrução, sem marca de erro; a recusada lança (35)', async (t) => {
  const on = await approving(t, [
    [launched()],
    [said('Não sei se entrou.')],
    [tool(WRITE, UNKNOWN_PRODUCT)],
    [said('Não lancei.')],
  ])
  const agent = await on.writer('AUTO')
  const a = await on.opened(agent.id)
  on.fake.orderSwitches.lostAfterStore = true
  await sent(on.hub, on.ana, a.url, 'Lance o pedido')
  assert.equal(endOf(await a.stream.turn()), 'complete')
  const [uncertain] = on.calls[1]?.toolResults ?? []
  assert.equal(uncertain?.error, false)
  const told = JSON.parse(uncertain?.text ?? '')
  assert.equal(told.kind, 'WRITE_UNCERTAIN')
  assert.match(told.instruction, /Do not call this again/)

  on.fake.orderSwitches.lostAfterStore = false
  const b = await on.opened(agent.id)
  await sent(on.hub, on.ana, b.url, 'Lance o pedido do produto 999')
  assert.equal(endOf(await b.stream.turn()), 'complete')
  const [refused] = on.calls[3]?.toolResults.slice(-1) ?? []
  assert.equal(refused?.error, true)
  assert.equal(JSON.parse(refused?.text ?? '').kind, 'REFUSED')
})

test('a versão antiga que deixa o campo fixo aberto: o modelo não recebe notaModelo, e se chamar a falha lançada não envia nada (44)', async (t) => {
  const asked = { ...ASKED, notaModelo: 99 }
  const on = await approving(t, [[tool(WRITE, asked)], [said('Não lancei.')]])
  const agent = await on.writer('AUTO')
  await on.hub.test.asOwner(
    "update builder.tool_version set config = jsonb_set(jsonb_set(config, '{bound}', (config->'bound') - 'notaModelo'), '{open}', (config->'open') || '[\"notaModelo\"]'::jsonb) where tool_id = $1",
    [on.write.id],
  )
  // A Hub that has not loaded the version yet: it reads what the library holds now.
  const lines: { fields: Record<string, unknown>; message: string }[] = []
  const log = {
    info: (fields: Record<string, unknown>, message: string) => lines.push({ fields, message }),
    error: (fields: Record<string, unknown>, message: string) => lines.push({ fields, message }),
  }
  const beside = await hubBeside(t, on.hub, log)
  const url = await talkedTo(beside, on.ana, on.agents, agent.id)
  const stream = await streamOf(beside, on.ana, url)
  t.after(() => stream.close())
  await sent(beside, on.ana, url, 'Lance o pedido')
  assert.equal(endOf(await stream.turn()), 'complete')
  const schema = JSON.stringify(on.calls[0]?.schemas[WRITE])
  assert.doesNotMatch(schema, /notaModelo/)
  const [result] = on.calls[1]?.toolResults ?? []
  assert.equal(result?.error, true)
  assert.deepEqual(JSON.parse(result?.text ?? ''), { kind: 'NOT_FIXED', field: 'notaModelo' })
  assert.deepEqual(on.fake.orders(), [])
  assert.deepEqual(await on.hub.test.asOwner('select 1 from connectors.connector_write'), [])
  const line = lines.find((each) => each.message === 'CONNECTOR_WRITE_NOT_FIXED')
  assert.equal(line?.fields.field, 'notaModelo')
  assert.equal(line?.fields.tool, 'lancar_pedido')
})
