import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CARD_TOOLS, TASK_TOOLS } from '@conexus/hub-api'
import {
  askUserTool,
  submitPlanTool,
  taskCheckTool,
  taskCompleteTool,
  taskUpdateTool,
  taskWriteTool,
} from '@mastra/core/agent-controller'

test('os nomes das ferramentas que a tela conhece são os que o Mastra dá às suas', () => {
  assert.deepEqual(CARD_TOOLS, { question: askUserTool.id, plan: submitPlanTool.id })
  assert.deepEqual(
    [...TASK_TOOLS],
    [taskWriteTool.id, taskUpdateTool.id, taskCompleteTool.id, taskCheckTool.id],
  )
})
