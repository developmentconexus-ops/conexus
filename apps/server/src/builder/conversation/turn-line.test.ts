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
  assert.equal(fields.end, 'complete')
  assert.equal(fields.failedTool, undefined)
  assert.equal(fields.errorCode, undefined)
  const everything = JSON.stringify(lines)
  assert.equal(everything.includes(CPF), false)
  assert.equal(everything.includes(TEXT), false)
})
