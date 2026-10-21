import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MessagePart } from '@conexus/hub-api'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, title } from './test-conversation.ts'

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

function partsOf(events: { type: string; part?: MessagePart }[]) {
  return events.flatMap((event) => (event.type === 'part' && event.part ? [event.part] : []))
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
    [{ type: 'version', number: 1, changed: true }],
  )
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  const journal = JSON.stringify(await hub.test.asOwner('select event from builder.run_event'))
  assert.equal(journal.includes(SECRET), false)
  assert.equal(JSON.stringify(events).includes(SECRET), false)
})

test('a saída de um comando longo chega só pelas últimas 20 linhas e 4 KiB', async (t) => {
  const long = {
    name: RUN.name,
    input: { command: 'seq 1 50; head -c 9000 /dev/zero | tr "\\0" x' },
  }
  const { hub, ana, conversations } = await conversing(t, calling(long))
  const { events } = await asked(t, { hub, person: ana, conversations })
  const [shell] = partsOf(events).filter((part) => part.type === 'shell')
  assert.ok(shell)
  assert.ok(shell.lines.length <= 20)
  assert.ok(Buffer.byteLength(shell.lines.join('\n')) <= 4096)
})
