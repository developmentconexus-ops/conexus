import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ConversationEvent, MastraPart } from '@conexus/hub-api'
import { WIRE_LIMITS } from '@conexus/hub-api'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, messagesOf, sent, streamOf, title } from './test-conversation.ts'
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

type Invocation = Extract<MastraPart, { type: 'tool-invocation' }>['toolInvocation']

/** The tool calls in these parts, as each ended (their last state), in order of first sight. */
function invocationsOf(parts: MastraPart[]): Invocation[] {
  const byCall = new Map<string, Invocation>()
  for (const part of parts) {
    if (part.type === 'tool-invocation') {
      byCall.set(part.toolInvocation.toolCallId, part.toolInvocation)
    }
  }
  return [...byCall.values()]
}

/** What a command's row said of its output, the last said first-hand: the output, the cuts and the exit. */
function commandsOf(events: ConversationEvent[]) {
  const outputs = new Map<string, { output: string; cut: boolean }>()
  for (const event of events) {
    if (event.type === 'shell_output') {
      outputs.set(event.toolCallId, {
        output: event.output,
        cut: event.cuts?.includes('output') ?? false,
      })
    }
  }
  const exits = new Map(
    events.flatMap((event) => (event.type === 'command_exit' ? [[event.toolCallId, event]] : [])),
  )
  return [...exits].map(([id, exit]) => ({ ...outputs.get(id), exitCode: exit.exitCode }))
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
  assert.deepEqual(commandsOf(events), [
    { output: `token=${VALUE}\npronto`, cut: false, exitCode: 0 },
  ])
  assert.ok(dataOf(events, 'data-conexus-machine').length > 0)
  const versions = dataOf(events, 'data-conexus-version')
  assert.equal(versions.length, 1)
  assert.match(JSON.stringify(versions[0]), /"number":1/)
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
})

test('a saída de um comando longo chega só pelas últimas 20 linhas e 4 KiB, cada limite por si', async (t) => {
  // 50 short lines pass the lines and not the bytes; 30 lines of 300 bytes, the bytes and not the
  // lines; one line of 9,000 bytes, the bytes alone. Spaced, so the secret filter leaves them be.
  const many = { name: RUN.name, input: { command: 'seq 1 50' } }
  const wide = {
    name: RUN.name,
    input: { command: 'for i in $(seq 101 130); do printf "%s%297s\\n" $i ""; done' },
  }
  const long = { name: RUN.name, input: { command: 'yes x | head -c 9000 | tr "\\n" " "' } }
  const { hub, ana, conversations } = await conversing(t, calling(many, wide, long))
  const { events } = await asked(t, { hub, person: ana, conversations })
  const [fifty, thirty, single] = commandsOf(events)
  function numbers(from: number, to: number) {
    return Array.from({ length: to - from + 1 }, (_, at) => String(from + at))
  }
  assert.deepEqual(fifty, {
    output: numbers(31, 50).join('\n'),
    cut: true,
    exitCode: 0,
  })
  // Thirteen lines of 300 bytes and their breaks are 3,912 bytes; a fourteenth passes 4 KiB.
  assert.deepEqual(thirty, {
    output: numbers(118, 130)
      .map((n) => n + ' '.repeat(297))
      .join('\n'),
    cut: true,
    exitCode: 0,
  })
  assert.deepEqual(single, { output: 'x '.repeat(2048), cut: true, exitCode: 0 })
  assert.ok((single?.output?.length ?? 0) <= WIRE_LIMITS.outputBytes)
})

/** The parts of the Builder's turn that outlive it: its tool calls and the version. */
function lasting(parts: MastraPart[]) {
  return parts.filter(
    (part) => part.type === 'tool-invocation' || part.type === 'data-conexus-version',
  )
}

test('o que dura do turno fica depois do fim e ao reabrir: cada ferramenta e a versão (33)', async (t) => {
  const { hub, ana, conversations } = await conversing(t, calling(WRITE, RUN))
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const read = (await messagesOf(hub, ana, url)).at(-1)
  assert.deepEqual(
    lasting(read?.parts ?? []).map((part) => part.type),
    ['tool-invocation', 'tool-invocation', 'data-conexus-version'],
  )
  const saidVersions = dataOf(events, 'data-conexus-version')
  const readVersions = (read?.parts ?? []).flatMap((part) =>
    part.type === 'data-conexus-version' ? [part.data] : [],
  )
  assert.deepEqual(readVersions, saidVersions)
  assert.deepEqual(
    invocationsOf(read?.parts ?? []).map((call) => [call.toolName, call.state, call.args]),
    [
      [WRITE.name, 'result', WRITE.input],
      [RUN.name, 'result', RUN.input],
    ],
  )
})

test('a máquina refeita fica dita depois do fim e ao reabrir', async (t) => {
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    if (step % 2 === 0) return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', ...WRITE }] }
  })
  const { url } = await asked(t, { hub, person: ana, conversations })
  hub.builder.control.exists = false
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'De novo')).statusCode, 202)
  const again = await stream.turn()
  const replaced = { phase: 'replaced' }
  assert.deepEqual(
    dataOf(again, 'data-conexus-machine').filter(
      (data) => JSON.stringify(data) === JSON.stringify(replaced),
    ),
    [replaced],
  )
  const read = (await messagesOf(hub, ana, url)).at(-1)
  assert.deepEqual(
    read?.parts.flatMap((part) =>
      part.type === 'data-conexus-machine' && 'data' in part ? [part.data] : [],
    ),
    [replaced],
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
  assert.equal(outputs.at(0), 'começo')
  assert.equal(outputs.at(-1), 'começo\nfim')
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

test('a saída relida é o resultado como o Mastra o guarda, cortado só pelo nosso limite, com "…"', async (t) => {
  const failing = {
    name: RUN.name,
    input: { command: `echo um; echo token=${VALUE} >&2; exit 2` },
  } as const
  const silent = { name: RUN.name, input: { command: 'true' } } as const
  const many = { name: RUN.name, input: { command: 'seq 1 3000' } } as const
  const { hub, ana, conversations } = await conversing(t, calling(failing, silent, many))
  const { url } = await asked(t, { hub, person: ana, conversations })
  const read = invocationsOf((await messagesOf(hub, ana, url)).at(-1)?.parts ?? [])
  const numbers = Array.from({ length: 20 }, (_, at) => String(2981 + at))
  assert.deepEqual(
    read.map((call) => call.result),
    [
      ['stdout:', 'um', '', '', 'stderr:', `token=${VALUE}`, '', 'Exit code: 2'].join('\n'),
      '(no output)',
      `…\n${numbers.join('\n')}`,
    ],
  )
})
