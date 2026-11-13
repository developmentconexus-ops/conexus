import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Agent } from '@mastra/core/agent'
import { ToolSearchProcessor } from '@mastra/core/processors'
import { MockLanguageModelV3 } from 'ai/test'
import { z } from 'zod'
import { TYPED_READ_NAMES, typedReads } from './typed-reads.ts'

const SEARCH = 'search_tools'
const PERGUNTAS = 'mercado-livre_perguntas'

const Offered = z.array(
  z.object({
    name: z.string(),
    strict: z.boolean().optional(),
    inputSchema: z.object({ required: z.array(z.string()).optional() }),
  }),
)
type Offered = z.infer<typeof Offered>

function finish(reason: 'tool-calls' | 'stop') {
  return {
    type: 'finish' as const,
    finishReason: { unified: reason, raw: undefined },
    usage: {
      inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 1, text: 1, reasoning: 0 },
    },
  }
}

/** The tools a model of `provider` is offered on the step after `search_tools` loaded `loaded`. */
async function offeredAfterSearch(provider: string, loaded: string): Promise<Offered> {
  const steps: Offered[] = []
  const model = new MockLanguageModelV3({
    provider,
    modelId: 'gpt-6-luna',
    doStream: async (options) => {
      steps.push(Offered.parse(options.tools ?? []))
      const searching = steps.length === 1
      const parts = searching
        ? [
            {
              type: 'tool-call' as const,
              toolCallId: 'c1',
              toolName: SEARCH,
              input: JSON.stringify({ query: loaded }),
            },
          ]
        : [
            { type: 'text-start' as const, id: 't' },
            { type: 'text-delta' as const, id: 't', delta: 'ok' },
            { type: 'text-end' as const, id: 't' },
          ]
      return {
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({ type: 'stream-start', warnings: [] })
            for (const part of parts) controller.enqueue(part)
            controller.enqueue(finish(searching ? 'tool-calls' : 'stop'))
            controller.close()
          },
        }),
      }
    },
  })
  const agent = new Agent({
    id: 'typed-reads',
    name: 'typed-reads',
    instructions: 'Read.',
    model,
    inputProcessors: [
      new ToolSearchProcessor({
        tools: typedReads(async () => undefined, '50 connector calls per run'),
        storage: 'context',
        search: { topK: 1, autoLoad: true },
      }),
    ],
  })
  const out = await agent.stream('Quais clientes perguntaram hoje?', {
    memory: { thread: 'thread-1', resource: 'resource-1' },
  })
  await out.consumeStream()
  const last = steps.at(-1)
  assert.equal(steps.length, 2, 'the search, then the step that has the loaded read')
  return last ?? []
}

test('a leitura achada pelo search_tools chega ao OpenAI sem campo obrigatório que o conector não pede', async () => {
  const offered = await offeredAfterSearch('openai.responses', PERGUNTAS)
  const read = offered.find((each) => each.name === PERGUNTAS)
  assert.ok(read, `${PERGUNTAS} loaded: ${offered.map((each) => each.name)}`)
  // The 17 refusals of 2026-11-13: strict, OpenAI makes the model fill offset, scan and scrollId.
  assert.equal(read.strict, false, 'not strict: the model may leave a field out')
  assert.deepEqual(read.inputSchema.required, ['connection', 'limit'])
})

test('todas as leituras tipadas deixam o modelo omitir o campo opcional', () => {
  const tools = typedReads(async () => undefined, '50 connector calls per run')
  assert.deepEqual(Object.keys(tools).sort(), [...TYPED_READ_NAMES].sort())
  for (const [name, each] of Object.entries(tools)) {
    assert.equal(Object(each).strict, false, `${name} is not strict`)
  }
})
