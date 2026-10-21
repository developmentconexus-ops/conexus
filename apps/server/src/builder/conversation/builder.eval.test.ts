import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Agent } from '@mastra/core/agent'
import { runExperiment } from '@mastra/core/datasets'
import { Mastra } from '@mastra/core/mastra'
import { InMemoryStore } from '@mastra/core/storage'
import { createTool } from '@mastra/core/tools'
import { checks } from '@mastra/evals/checks'
import { MockLanguageModelV3 } from 'ai/test'
import { z } from 'zod'

const WRITE = 'mastra_workspace_write_file'
const RUN = 'mastra_workspace_execute_command'

function fakeTool(id: string, input: z.ZodObject) {
  return createTool({
    id,
    description: `A stand-in for ${id}; the experiment serves its mocked output.`,
    inputSchema: input,
    execute: async () => {
      throw new Error('a tool that ran live in the gate')
    },
  })
}

function call(toolCallId: string, toolName: string, input: object) {
  return { type: 'tool-call' as const, toolCallId, toolName, input: JSON.stringify(input) }
}

const USAGE = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
}

/** A model that writes the page, then answers: the Builder's shape of a turn, one step a call. */
function scriptedModel(steps: ('write' | 'stray' | 'answer')[]) {
  let step = 0
  return new MockLanguageModelV3({
    doGenerate: async () => {
      const now = steps[step++] ?? 'answer'
      const content =
        now === 'write'
          ? [call('w', WRITE, { path: 'index.html', content: '<h1>Padaria</h1>' })]
          : now === 'stray'
            ? [call('s', RUN, { command: 'rm -rf /' })]
            : [{ type: 'text' as const, text: 'Escrevi a página.' }]
      const unified = now === 'answer' ? ('stop' as const) : ('tool-calls' as const)
      return { content, finishReason: { unified, raw: undefined }, usage: USAGE, warnings: [] }
    },
  })
}

async function gate(steps: ('write' | 'stray' | 'answer')[]) {
  const agent = new Agent({
    id: 'builder',
    name: 'Builder',
    instructions: 'Write the files the person asks for.',
    model: scriptedModel(steps),
    tools: {
      [WRITE]: fakeTool(WRITE, z.object({ path: z.string(), content: z.string() })),
      [RUN]: fakeTool(RUN, z.object({ command: z.string() })),
    },
  })
  const mastra = new Mastra({ agents: { builder: agent }, storage: new InMemoryStore() })
  return runExperiment(mastra, {
    targetType: 'agent',
    targetId: 'builder',
    data: [
      {
        input: 'Faça uma página para a padaria',
        toolMocks: [
          {
            toolName: WRITE,
            args: { path: 'index.html', content: '<h1>Padaria</h1>' },
            output: 'Wrote index.html',
          },
        ],
      },
    ],
    scorers: [checks.calledTool(WRITE), checks.noToolErrors()],
    unmockedToolPolicy: 'deny',
    persistence: { experiments: 'none', scores: 'none' },
  })
}

test('o portão do Builder: escreveu os arquivos e nenhuma ferramenta deu erro', async () => {
  const summary = await gate(['write', 'answer'])
  assert.equal(summary.failedCount, 0)
  const scores = summary.results.flatMap((result) => result.scores)
  assert.deepEqual(
    scores.map((score) => score.score),
    [1, 1],
  )
})

test('o portão pega o Builder que não escreve, ou que chama o que não foi combinado', async () => {
  const silent = await gate(['answer'])
  assert.deepEqual(
    silent.results.flatMap((result) => result.scores).map((score) => score.score),
    [0, 1],
  )
  const stray = await gate(['write', 'stray', 'answer'])
  assert.equal(stray.failedCount, 1)
  assert.equal(stray.results[0]?.error?.code, 'TOOL_MOCK_NOT_DECLARED')
})
