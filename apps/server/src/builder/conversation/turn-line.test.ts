import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, title } from './test-conversation.ts'

const CPF = '123.456.789-09'
const TEXT = 'cliente-de-verdade-da-padaria'

/** A command that carries a person's text and a CPF, then an answer. */
function ranWithPlanted() {
  let step = 0
  return (call: Sent): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    if (step > 1) return { kind: 'text', text: 'Pronto.' }
    const command = `echo ${TEXT} ${CPF}`
    return {
      kind: 'blocks',
      blocks: [{ type: 'tool_use', name: 'mastra_workspace_execute_command', input: { command } }],
    }
  }
}

test('a linha do turno: duração, passos, tokens, fim e o id do pedido; texto e CPF de um comando, fora do log', async (t) => {
  const { hub, ana, conversations, lines } = await conversing(t, ranWithPlanted())
  await asked(t, { hub, person: ana, conversations })
  const [ended] = lines.filter((line) => line.message === 'CONVERSATION_TURN_ENDED')
  assert.ok(ended)
  const { fields } = ended
  assert.match(String(fields.runId), /^[0-9a-f-]{36}$/)
  assert.match(String(fields.traceId), /^[0-9a-f-]{36}$/)
  assert.equal(typeof fields.ms, 'number')
  assert.ok(Number(fields.steps) >= 2)
  assert.ok(Number(fields.tokens) > 0)
  assert.equal(fields.maxInputTokens, 14, 'the fullest step: 10 new and 4 read from the cache')
  assert.equal(fields.cachedInputTokens, 4 * Number(fields.steps))
  assert.equal(fields.rounds, 0, 'a turn that changed nothing is not judged at its end')
  assert.equal(fields.finishReason, undefined, 'a normal finish says nothing more than its end')
  assert.equal(fields.end, 'complete')
  assert.equal(fields.failedTool, undefined)
  assert.equal(fields.errorCode, undefined)
  const everything = JSON.stringify(lines)
  assert.equal(everything.includes(CPF), false)
  assert.equal(everything.includes(TEXT), false)
})

test('a linha do turno leva como o modelo terminou quando não foi normal: no limite de saída, length (14.2, 17)', async (t) => {
  const { hub, ana, conversations, lines } = await conversing(t, (call): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    return { kind: 'blocks', blocks: [{ type: 'text', text: 'Começo' }], stop: 'max_tokens' }
  })
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'error' })
  const [ended] = lines.filter((line) => line.message === 'CONVERSATION_TURN_ENDED')
  assert.equal(ended?.fields.end, 'error')
  assert.equal(ended?.fields.finishReason, 'length')
  assert.equal(ended?.fields.errorCode, 'MODEL_CALL_FAILED')
})
