import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { z } from 'zod'
import { testCliProxy } from '../../platform/test-cliproxy-binary.ts'
import { endOf, streamOf } from '../conversation/test-conversation.ts'
import { created } from './test-assistant.ts'
import { googleOnly } from './test-google-assistant.ts'

/** About 12 thousand tokens of the person's own words, so three of them pass the observer's 30 thousand. */
const LONG = 'As encomendas da padaria chegam pelo telefone e pelo balcão. '.repeat(800)

const Call = z.object({
  model: z.string(),
  messages: z.array(z.object({ role: z.string(), content: z.unknown() })),
  reasoning_effort: z.string().optional(),
})
type Call = z.infer<typeof Call>

/** Whether the call is Mastra's observer: its system message opens with the observer's own words. */
function isObserver(call: Call): boolean {
  const system = call.messages.find((message) => message.role === 'system')
  return (
    typeof system?.content === 'string' &&
    system.content.startsWith('You are the memory consciousness')
  )
}

/**
 * Three turns of about 12 thousand tokens each, on a Gemini conversation through the CLIProxy double
 * whose observer answers as `observer` says, and the calls the proxy received, read from its own record.
 */
async function threeTurns(t: TestContext, observer: 'ok' | 'fail', served?: string) {
  const { control } = testCliProxy()
  for (const file of ['bodies', 'models', 'observer']) rmSync(join(control, file), { force: true })
  writeFileSync(join(control, 'observer'), observer)
  if (served !== undefined) writeFileSync(join(control, 'models'), served)
  const on = await googleOnly(t)
  t.after(() => {
    for (const file of ['bodies', 'models', 'observer'])
      rmSync(join(control, file), { force: true })
  })
  const assistant = `/api/companies/${on.companyId}/assistant/conversations`
  const body = { model: 'google/gemini-3.8-flash-high', effort: 'high', connections: [] }
  const url = await created(on.hub, on.ana, assistant, body)
  const stream = await streamOf(on.hub, on.ana, url)
  t.after(() => stream.close())
  const events = []
  for (let turn = 0; turn < 3; turn++) {
    await on.asking(on.ana, url, 'google-thinking', on.hub, LONG)
    const one = await stream.turn()
    assert.equal(endOf(one), 'complete')
    events.push(...one)
  }
  const path = join(control, 'bodies')
  const lines = existsSync(path) ? readFileSync(path, 'utf8').trim().split('\n') : []
  const calls = lines.map((line) => Call.parse(JSON.parse(line)))
  return {
    types: events.map((event) => event.type),
    observed: calls.filter(isObserver),
    main: calls.filter((call) => !isObserver(call) && call.reasoning_effort !== undefined),
    lines: on.hub.lines,
  }
}

test('a memória no CLIProxy: com o observador respondendo, depois de 30 mil tokens a memória guarda e a falha não aparece; o pedido do observador pede o modelo barato que o proxy serve, e o principal segue com o esforço', {
  timeout: 120_000,
}, async (t) => {
  const run = await threeTurns(t, 'ok')
  assert.ok(run.types.includes('om_observation_end'), 'the observation ended')
  assert.equal(run.types.includes('om_observation_failed'), false)
  assert.ok(run.observed.length > 0, 'the observer called the proxy')
  for (const call of run.observed) assert.equal(call.model, 'gemini-3.5-flash-lite')
  assert.ok(run.main.length >= 3, 'every turn asked with its effort')
  for (const call of run.main) {
    assert.deepEqual([call.model, call.reasoning_effort], ['gemini-3.8-flash-high', 'high'])
  }
})

test('a memória no CLIProxy: se o proxy não serve o modelo barato, o observador pede o modelo da conversa, como antes', {
  timeout: 120_000,
}, async (t) => {
  const run = await threeTurns(t, 'ok', 'gemini-3.8-flash-high,gemini-3-flash')
  assert.ok(run.observed.length > 0, 'the observer called the proxy')
  for (const call of run.observed) assert.equal(call.model, 'gemini-3.8-flash-high')
})

test('a memória no CLIProxy: se o observador falha, o turno termina, a memória não guarda e o log diz MASTRA_ERROR com o nome e o status do erro', {
  timeout: 120_000,
}, async (t) => {
  const run = await threeTurns(t, 'fail')
  assert.ok(run.types.includes('om_observation_failed'), 'the observation failed')
  assert.equal(run.types.includes('om_observation_end'), false)
  const logged = run.lines.filter((line) => line.message === 'MASTRA_ERROR')
  assert.ok(
    logged.some((line) => line.fields.name === 'AI_APICallError' && line.fields.status === 500),
    JSON.stringify(logged),
  )
})
