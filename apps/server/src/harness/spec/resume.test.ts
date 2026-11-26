import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { createAnthropic } from '@ai-sdk/anthropic'
import { Mastra } from '@mastra/core'
import { Agent } from '@mastra/core/agent'
import { InMemoryStore } from '@mastra/core/storage'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { Reply } from '../../platform/test-anthropic.ts'
import { plantAnthropic } from '../../platform/test-anthropic.ts'
import { refuseUnaskedResume } from './public.ts'

const DELEGATED = 'agent-ajudante'

/** No ficha mounts an `agent-*` tool today, so a plain tool under that id runs on Mastra alone. */
async function runApprovedDelegation(t: TestContext, input: object) {
  const got: unknown[] = []
  const delegated = createTool({
    id: DELEGATED,
    description: 'Um agente delegado.',
    inputSchema: z.object({ prompt: z.string() }),
    requireApproval: true,
    execute: async (_input, context) => {
      got.push(context?.agent?.resumeData)
      return { text: 'Feito.' }
    },
  })
  const replies: Reply[] = [
    { kind: 'blocks', blocks: [{ type: 'tool_use', name: DELEGATED, input }] },
  ]
  plantAnthropic(t, () => replies.shift() ?? { kind: 'text', text: 'Pronto.' })
  const agent = new Agent({
    id: 'pai',
    name: 'Pai',
    instructions: 'Delegue.',
    model: createAnthropic({ apiKey: 'sk-ant-planted' })('claude-sonnet-4-6'),
    tools: { [DELEGATED]: delegated },
    hooks: { beforeToolCall: refuseUnaskedResume },
  })
  const mastra = new Mastra({ agents: { agent }, storage: new InMemoryStore(), logger: false })
  const first = await mastra.getAgent('agent').stream('Delegue a tarefa', { maxSteps: 3 })
  let waiting: string | undefined
  for await (const chunk of first.fullStream) {
    if (chunk.type === 'tool-call-approval') waiting = chunk.payload.toolCallId
  }
  assert.ok(waiting, 'the call waits for the person')
  assert.deepEqual(got, [])
  const resumed = await mastra
    .getAgent('agent')
    .approveToolCall({ runId: first.runId, toolCallId: waiting })
  const failed: string[] = []
  for await (const chunk of resumed.fullStream) {
    if (chunk.type === 'tool-error') failed.push(chunk.payload.toolName)
  }
  return { got, failed }
}

test('a aprovação de um agente-ferramenta chega sem suspensão, e a ferramenta roda com ela', async (t) => {
  assert.deepEqual(await runApprovedDelegation(t, { prompt: 'Some as vendas' }), {
    got: [{ approved: true }],
    failed: [],
  })
})

test('um agente-ferramenta não roda com uma retomada que ninguém pediu e que não é uma aprovação', async (t) => {
  const written = { prompt: 'Some as vendas', resumeData: { answer: 'sim' } }
  assert.deepEqual(await runApprovedDelegation(t, written), { got: [], failed: [DELEGATED] })
})
