import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ConversationEvent, MessagePart, ToolDetail } from '@conexus/hub-api'
import { applyEvent } from '@conexus/hub-api'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, messagesOf, sent, streamOf, title } from './test-conversation.ts'

const SECRET = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789'
const WRITE = { name: 'mastra_workspace_write_file', input: { path: 'a.ts', content: 'x\n' } }
const RUN = {
  name: 'mastra_workspace_execute_command',
  input: { command: `echo token=${SECRET}; echo pronto` },
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

/** The parts the turn's events add up to, as the screen folds them. */
function partsOf(events: ConversationEvent[]): MessagePart[] {
  return events.reduce<MessagePart[]>(
    (parts, event) => (event.type === 'part' ? applyEvent(parts, event) : parts),
    [],
  )
}

type Command = Extract<ToolDetail, { kind: 'command' }>

/** A command's detail in each tool part the turn said, in order: its lines as it ran, then at its end. */
function commandsOf(parts: MessagePart[]): Command[] {
  return parts.flatMap((part) =>
    part.type === 'tool' && part.detail?.kind === 'command' ? [part.detail] : [],
  )
}

function saidParts(events: ConversationEvent[]): MessagePart[] {
  return events.flatMap((event) => (event.type === 'part' ? [event.part] : []))
}

test('um turno que escreve: ferramentas por tipo e assunto, arquivo, saída do comando sem segredo, máquina e versão', async (t) => {
  const { hub, ana, conversations } = await conversing(t, calling(WRITE, RUN))
  const { events } = await asked(t, { hub, person: ana, conversations })
  const parts = partsOf(events)
  const tools = parts.flatMap((part) => (part.type === 'tool' ? [part] : []))
  const done = tools.filter((tool) => tool.state === 'completed')
  assert.deepEqual(
    done.map((tool) => [tool.kind, tool.subject]),
    [
      ['write_file', { path: 'a.ts' }],
      ['run_command', { command: 'echo token=***; echo pronto' }],
    ],
  )
  assert.deepEqual(
    parts.filter((part) => part.type === 'file').map((part) => [part.path, part.operation]),
    [['a.ts', 'write']],
  )
  assert.deepEqual(commandsOf(parts), [
    {
      kind: 'command',
      command: 'echo token=***; echo pronto',
      output: ['token=***', 'pronto'],
      exitCode: 0,
      cut: false,
    },
  ])
  assert.ok(parts.some((part) => part.type === 'machine'))
  const versions = parts.filter((part) => part.type === 'version')
  assert.deepEqual(
    versions.map((part) => [part.number, part.changed, part.changedFiles]),
    [[1, true, 1]],
  )
  assert.ok((versions[0]?.files ?? 0) > 1, 'the version holds the starter beside the turn')
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  const journal = JSON.stringify(await hub.test.asOwner('select event from builder.run_event'))
  assert.equal(journal.includes(SECRET), false)
  assert.equal(JSON.stringify(events).includes(SECRET), false)
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
  // What the row heard of each command when it exited, each cut by its limit; the result Mastra
  // keeps of a long one is its own cut for the model, read back as it is.
  const running = saidParts(events).filter(
    (part) => part.type === 'tool' && part.state === 'running',
  )
  const heard = commandsOf(running)
  function last(test: (line: string | undefined) => boolean) {
    const found = heard.findLast((command) => command.output.length > 0 && test(command.output[0]))
    assert.ok(found?.cut, 'the row says it was cut')
    return found?.output
  }
  function numbers(from: number, to: number) {
    return Array.from({ length: to - from + 1 }, (_, at) => String(from + at))
  }
  assert.deepEqual(
    last((line) => /^\d+$/.test(line ?? '')),
    numbers(31, 50),
  )
  // Thirteen lines of 300 bytes and their breaks are 3,912 bytes; a fourteenth passes 4 KiB.
  assert.deepEqual(
    last((line) => line?.length === 300),
    numbers(118, 130).map((n) => n + ' '.repeat(297)),
  )
  assert.deepEqual(
    last((line) => line?.[0] === 'x'),
    ['x '.repeat(2048)],
  )
})

/** The parts of the Builder's turn that outlive it: its tools, with what each opens on, and the version. */
function lasting(parts: MessagePart[]) {
  return parts.filter((part) => part.type === 'tool' || part.type === 'version')
}

test('o que dura do turno fica depois do fim e ao reabrir: o detalhe de cada ferramenta e a versão (33)', async (t) => {
  const { hub, ana, conversations } = await conversing(t, calling(WRITE, RUN))
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const read = (await messagesOf(hub, ana, url)).at(-1)
  assert.deepEqual(
    lasting(read?.parts ?? []).map((part) => part.type),
    ['tool', 'tool', 'version'],
  )
  assert.deepEqual(lasting(read?.parts ?? []), lasting(partsOf(events)))
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
  const replaced = { type: 'machine', phase: 'replaced' }
  assert.ok(partsOf(again).some((part) => JSON.stringify(part) === JSON.stringify(replaced)))
  const read = (await messagesOf(hub, ana, url)).at(-1)
  assert.deepEqual(
    read?.parts.filter((part) => part.type === 'machine'),
    [replaced],
  )
})

test('a saída de um comando chega enquanto ele roda, sem código de saída, antes do fim', async (t) => {
  const slow = { name: RUN.name, input: { command: 'echo começo; sleep 2; echo fim' } }
  const { hub, ana, conversations } = await conversing(t, calling(slow))
  const { events } = await asked(t, { hub, person: ana, conversations })
  const commands = commandsOf(saidParts(events)).filter((command) => command.output.length > 0)
  assert.deepEqual(commands.at(0), { ...commands.at(0), output: ['começo'], exitCode: null })
  assert.deepEqual(commands.at(-1), { ...commands.at(-1), output: ['começo', 'fim'], exitCode: 0 })
})

test('ler um arquivo tem o seu tipo e o caminho como assunto', async (t) => {
  const read = { name: 'mastra_workspace_read_file', input: { path: 'src/nada.ts' } }
  const { hub, ana, conversations } = await conversing(t, calling(read))
  const { events } = await asked(t, { hub, person: ana, conversations })
  const tools = partsOf(events).flatMap((part) => (part.type === 'tool' ? [part] : []))
  assert.deepEqual(
    tools.map((tool) => [tool.kind, tool.subject]),
    [['read_file', { path: 'src/nada.ts' }]],
  )
})

test('a saída longa relida do resultado do Mastra termina em "…", sem a nota em inglês do corte que ele escreve para o modelo', async (t) => {
  const many = { name: RUN.name, input: { command: 'seq 1 3000' } }
  const long = { name: RUN.name, input: { command: 'yes x | head -c 9000 | tr "\\n" " "' } }
  const { hub, ana, conversations } = await conversing(t, calling(many, long))
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const ended = commandsOf(partsOf(events))
  const read = commandsOf((await messagesOf(hub, ana, url)).at(-1)?.parts ?? [])
  assert.deepEqual(read, ended, 'read again, each command opens on what the stream said at its end')
  for (const line of ended.flatMap((command) => command.output)) {
    assert.doesNotMatch(line, /truncated|showing|dropped/)
  }
  assert.deepEqual(
    ended.map((command) => [command.cut, command.output.at(-1)?.slice(-4)]),
    [
      [true, '3000'],
      [true, 'x x '],
    ],
  )
})

test('a saída relida do resultado do Mastra é só a do comando: sem `stdout:`, `stderr:`, `(no output)` nem `Exit code`', async (t) => {
  const failing = { name: RUN.name, input: { command: 'echo um; echo dois >&2; exit 2' } } as const
  const silent = { name: RUN.name, input: { command: 'true' } } as const
  const { hub, ana, conversations } = await conversing(t, calling(failing, silent))
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const ended = commandsOf(partsOf(events))
  const read = commandsOf((await messagesOf(hub, ana, url)).at(-1)?.parts ?? [])
  assert.deepEqual(read, ended, 'read again, each command opens on what the stream said at its end')
  assert.deepEqual(
    ended.map((command) => [command.output, command.exitCode]),
    [
      [['um', 'dois'], 2],
      [[], 0],
    ],
  )
})
