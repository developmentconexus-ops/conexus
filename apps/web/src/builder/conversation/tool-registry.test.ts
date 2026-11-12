import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ASSISTANT_ROOM, BUILDER_ROOM } from './room.ts'
import { presentTool } from './tool-registry.ts'

const COMMAND = 'mastra_workspace_execute_command'
const PHRASE = 'Somando os pedidos por vendedor'

test('a frase do comando', () => {
  for (const room of [BUILDER_ROOM, ASSISTANT_ROOM]) {
    const args = { description: PHRASE, command: 'python soma.py' }
    const done = presentTool({ toolName: COMMAND, args }, 'done', room)
    assert.equal(done.sentence, PHRASE)
    assert.equal(done.detail, 'python soma.py', 'the open row keeps the command')
    const failed = presentTool({ toolName: COMMAND, args }, 'error', room)
    assert.equal(failed.sentence, `Um comando falhou: ${PHRASE}`)
    const stored = presentTool({ toolName: COMMAND, args: { command: 'ls' } }, 'done', room)
    assert.equal(
      stored.sentence,
      'Rodou um comando ls',
      'a call stored without the phrase reads as before',
    )
  }
})
