import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import type { StreamEvent } from './test-conversation.ts'
import { asked, conversing, endOf, messagesOf, title } from './test-conversation.ts'
import { dataOf, partsOf } from './test-parts.ts'

const VALUE = 'abc123'
const WRITE = { name: 'mastra_workspace_write_file', input: { path: 'a.ts', content: 'x\n' } }
const RUN = {
  name: 'mastra_workspace_execute_command',
  input: { command: `echo token=${VALUE}; echo pronto` },
}

/** One step with the given tools, then an answer. */
function calling(...tools: { name: string; input: object }[]) {
  let step = 0
  return (call: Sent): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    if (step > 1) return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: tools.map((tool) => ({ type: 'tool_use', ...tool })) }
  }
}

type Invocation = Extract<MastraMessagePart, { type: 'tool-invocation' }>['toolInvocation']

/** The tool calls in these parts, as each ended (their last state), in order of first sight. */
function invocationsOf(parts: MastraMessagePart[]): Invocation[] {
  const byCall = new Map<string, Invocation>()
  for (const part of parts) {
    if (part.type === 'tool-invocation') {
      byCall.set(part.toolInvocation.toolCallId, part.toolInvocation)
    }
  }
  return [...byCall.values()]
}

/** What a command's row said: its output as Mastra sent it, piece by piece, and its exit. */
function commandsOf(events: StreamEvent[]) {
  const outputs = new Map<string, string>()
  for (const event of events) {
    if (event.type === 'shell_output') {
      outputs.set(event.toolCallId, (outputs.get(event.toolCallId) ?? '') + event.output)
    }
  }
  const exits = new Map(
    events.flatMap((event) => (event.type === 'command_exit' ? [[event.toolCallId, event]] : [])),
  )
  return [...exits].map(([id, exit]) => ({ output: outputs.get(id), exitCode: exit.exitCode }))
}

test('um turno que escreve: ferramentas com os argumentos, saída do comando sem segredo, máquina e versão', async (t) => {
  const { hub, ana, conversations } = await conversing(t, calling(WRITE, RUN))
  const { events } = await asked(t, { hub, person: ana, conversations })
  const done = invocationsOf(partsOf(events)).filter((call) => call.state === 'result')
  assert.deepEqual(
    done.map((call) => [call.toolName, call.args]),
    [
      [WRITE.name, WRITE.input],
      [RUN.name, RUN.input],
    ],
  )
  assert.deepEqual(commandsOf(events), [{ output: `token=${VALUE}\npronto\n`, exitCode: 0 }])
  assert.ok(dataOf(events, 'data-conexus-machine').length > 0)
  const versions = dataOf(events, 'data-conexus-version')
  assert.equal(versions.length, 1)
  assert.match(JSON.stringify(versions[0]), /"number":1/)
  assert.equal(endOf(events), 'complete')
})

test('a saída de um comando longo chega inteira, como o Mastra a manda: nenhum corte no servidor (5)', async (t) => {
  const many = { name: RUN.name, input: { command: 'seq 1 50' } }
  const long = { name: RUN.name, input: { command: 'yes x | head -c 9000 | tr "\\n" " "' } }
  const { hub, ana, conversations } = await conversing(t, calling(many, long))
  const { events } = await asked(t, { hub, person: ana, conversations })
  const [fifty, single] = commandsOf(events)
  const lines = Array.from({ length: 50 }, (_, at) => String(at + 1))
  assert.equal(fifty?.output?.trimEnd(), lines.join('\n'))
  assert.equal(single?.output?.length, 9000)
})

/** The parts of the Builder's turn that outlive it: its tool calls and the version. */
function lasting(parts: MastraMessagePart[]) {
  return parts.filter(
    (part) => part.type === 'tool-invocation' || part.type === 'data-conexus-version',
  )
}

test('o que dura do turno fica depois do fim e ao reabrir: cada ferramenta e a versão (33)', async (t) => {
  const { hub, ana, conversations } = await conversing(t, calling(WRITE, RUN))
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const messages = await messagesOf(hub, ana, url)
  // Mastra keeps a message per step: the turn is every message after the person's.
  const read = {
    parts: messages
      .slice(messages.findLastIndex((message) => message.role === 'person') + 1)
      .flatMap((message) => message.parts),
  }
  assert.deepEqual(
    lasting(read.parts).map((part) => part.type),
    ['tool-invocation', 'tool-invocation', 'data-conexus-version'],
  )
  const saidVersions = dataOf(events, 'data-conexus-version')
  const readVersions = read.parts.flatMap((part) =>
    part.type === 'data-conexus-version' ? [part.data] : [],
  )
  assert.deepEqual(readVersions, saidVersions)
  assert.deepEqual(
    invocationsOf(read.parts).map((call) => [call.toolName, call.state, call.args]),
    [
      [WRITE.name, 'result', WRITE.input],
      [RUN.name, 'result', RUN.input],
    ],
  )
})

test('a saída de um comando chega enquanto ele roda, sem código de saída, antes do fim', async (t) => {
  const slow = { name: RUN.name, input: { command: 'echo começo; sleep 2; echo fim' } }
  const { hub, ana, conversations } = await conversing(t, calling(slow))
  const { events } = await asked(t, { hub, person: ana, conversations })
  function at(type: string) {
    return events.findIndex((event) => event.type === type)
  }
  const outputs = events.flatMap((event) => (event.type === 'shell_output' ? [event.output] : []))
  assert.equal(outputs.at(0), 'começo\n')
  assert.equal(outputs.join(''), 'começo\nfim\n')
  const firstOutput = at('shell_output')
  assert.ok(firstOutput >= 0 && firstOutput < at('command_exit'), 'the output came before the exit')
})

test('ler um arquivo é uma ferramenta com o caminho nos argumentos', async (t) => {
  const read = { name: 'mastra_workspace_read_file', input: { path: 'src/nada.ts' } }
  const { hub, ana, conversations } = await conversing(t, calling(read))
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(
    invocationsOf(partsOf(events)).map((call) => [call.toolName, call.args]),
    [[read.name, read.input]],
  )
})

test('a saída relida é o resultado como o Mastra o guarda, sem corte do servidor (5)', async (t) => {
  const failing = {
    name: RUN.name,
    input: { command: `echo um; echo token=${VALUE} >&2; exit 2` },
  } as const
  const silent = { name: RUN.name, input: { command: 'true' } } as const
  const many = { name: RUN.name, input: { command: 'seq 1 3000' } } as const
  const { hub, ana, conversations } = await conversing(t, calling(failing, silent, many))
  const { url } = await asked(t, { hub, person: ana, conversations })
  const read = invocationsOf((await messagesOf(hub, ana, url)).at(-1)?.parts ?? [])
  const numbers = Array.from({ length: 200 }, (_, at) => String(2801 + at))
  assert.deepEqual(
    read.map((call) => call.result),
    [
      ['stdout:', 'um', '', '', 'stderr:', `token=${VALUE}`, '', 'Exit code: 2'].join('\n'),
      '(no output)',
      `[showing last 200 of 3000 lines]\n${numbers.join('\n')}\n`,
    ],
  )
})
