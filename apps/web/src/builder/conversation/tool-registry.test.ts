import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ASSISTANT_ROOM, BUILDER_ROOM } from './room.ts'
import { recordedPart, SubagentPart } from './test-recorded.ts'
import { presentTool, toolStatus } from './tool-registry.ts'

const COMMAND = 'mastra_workspace_execute_command'
const PHRASE = 'Somando os pedidos por vendedor'

test('a frase do comando', () => {
  for (const room of [BUILDER_ROOM, ASSISTANT_ROOM]) {
    const args = { description: PHRASE, command: 'python soma.py' }
    const done = presentTool({ toolName: COMMAND, args }, 'done', room)
    assert.equal(done.sentence, PHRASE)
    assert.equal(done.detail, 'python soma.py', 'the open row keeps the command')
    const running = presentTool({ toolName: COMMAND, args }, 'running', room)
    assert.equal(running.sentence, `Rodando… ${PHRASE}`, 'the matrix: Rodando… with the phrase')
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

const TASK = 'Quantos pedidos a Matriz teve em outubro, por vendedor, comparando com setembro?'

test('o ajudante', () => {
  for (const room of [BUILDER_ROOM, ASSISTANT_ROOM]) {
    const args = { agentType: 'pesquisar', task: TASK }
    const running = presentTool({ toolName: 'subagent', args }, 'running', room)
    assert.equal(running.sentence, 'Pesquisando')
    assert.equal(running.detail, TASK, 'the question, cut beside the sentence by the line')
    assert.equal(running.beside, true)
    const done = presentTool({ toolName: 'subagent', args }, 'done', room)
    assert.equal(done.sentence, 'Pesquisou')
    assert.equal(done.detail, TASK)
    const failed = presentTool({ toolName: 'subagent', args }, 'error', room)
    assert.equal(failed.sentence, 'A pesquisa falhou')
    assert.equal(failed.detail, TASK)
    assert.equal(failed.beside, true, 'a failed line is cut too')

    // What Mastra's `subagent` returned when the helper answered, and when its model call failed.
    const found = recordedPart('research', SubagentPart).toolInvocation.result
    const lost = recordedPart('research-failed', SubagentPart).toolInvocation.result
    const call = { toolName: 'subagent', state: 'result' as const, isError: undefined }
    assert.equal(toolStatus({ ...call, result: found }, room), 'done')
    assert.equal(toolStatus({ ...call, result: lost }, room), 'error')
  }
})
