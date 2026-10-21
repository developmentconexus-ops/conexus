import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ConversationEvent, MessagePart } from '@conexus/hub-api'
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

/** Every `shell` part the turn said, in order: a command's lines as it ran, then at its end. */
function shellsOf(events: ConversationEvent[]) {
  return events.flatMap((event) =>
    event.type === 'part' && event.part.type === 'shell' ? [event.part] : [],
  )
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
  const [shell] = parts.filter((part) => part.type === 'shell')
  assert.deepEqual([shell?.lines, shell?.exitCode], [['token=***', 'pronto'], 0])
  assert.ok(parts.some((part) => part.type === 'machine'))
  assert.deepEqual(
    parts.filter((part) => part.type === 'version'),
    [{ type: 'version', number: 1, changed: true, files: 1, changedFiles: 1 }],
  )
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
  const shells = partsOf(events).flatMap((part) => (part.type === 'shell' ? [part.lines] : []))
  function numbers(from: number, to: number) {
    return Array.from({ length: to - from + 1 }, (_, at) => String(from + at))
  }
  assert.deepEqual(
    shells.find((lines) => lines[0]?.length !== 300 && lines[0]?.[0] !== 'x'),
    numbers(31, 50),
  )
  // Thirteen lines of 300 bytes and their breaks are 3,912 bytes; a fourteenth passes 4 KiB.
  assert.deepEqual(
    shells.find((lines) => lines[0]?.length === 300),
    numbers(118, 130).map((n) => n + ' '.repeat(297)),
  )
  assert.deepEqual(
    shells.find((lines) => lines[0]?.[0] === 'x'),
    ['x '.repeat(2048)],
  )
})

/** The parts of the Builder's turn that outlive it: the command's lines and the version. */
function lasting(parts: MessagePart[]) {
  return parts.filter((part) => part.type === 'shell' || part.type === 'version')
}

test('o que dura do turno fica depois do fim e ao reabrir: as linhas do comando e a versão', async (t) => {
  const { hub, ana, conversations } = await conversing(t, calling(WRITE, RUN))
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const read = (await messagesOf(hub, ana, url)).at(-1)
  assert.deepEqual(
    lasting(read?.parts ?? []).map((part) => part.type),
    ['shell', 'version'],
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
  const shells = shellsOf(events)
  assert.deepEqual(shells.at(0), { ...shells.at(0), lines: ['começo'], exitCode: null })
  assert.deepEqual(shells.at(-1), { ...shells.at(-1), lines: ['começo', 'fim'], exitCode: 0 })
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
