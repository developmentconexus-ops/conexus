import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import {
  answeredOf,
  asked,
  conversing,
  endOf,
  messagesOf,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { failuresOf, partsOf, versionsOf } from './test-parts.ts'
import { WHO } from './test-questions.ts'

const WRITE = {
  type: 'tool_use',
  name: 'mastra_workspace_write_file',
  input: { path: 'a.ts', content: 'x\n' },
} as const
const TASKS = {
  type: 'tool_use',
  name: 'task_write',
  input: {
    tasks: [
      { content: 'Tela de encomendas', activeForm: 'Fazendo a tela', status: 'in_progress' },
      { content: 'Filtro por data', activeForm: 'Filtrando', status: 'pending' },
    ],
  },
} as const

/** The model's JSON for `ask_user`, cut short, as an unvalidated tool stream may deliver it. */
const TRUNCATED = JSON.stringify({ questions: [WHO] }).slice(0, -12)

test('uma chamada de ferramenta que o Mastra guardou sem argumentos não quebra a conversa: os dois turnos seguintes terminam', async (t) => {
  // Mastra says an unparseable call on `console.error`, outside any logger; the run's output carries only log lines.
  const said = t.mock.method(console, 'error', () => undefined)
  const calls: Sent[] = []
  const { hub, ana, conversations } = await conversing(t, (call): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    calls.push(call)
    return calls.length === 1
      ? {
          kind: 'blocks',
          blocks: [WRITE, { type: 'tool_use', name: 'ask_user', input: TRUNCATED }],
        }
      : { kind: 'text', text: 'Pronto.' }
  })
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  for (const content of ['Crie o app', 'Segunda', 'Terceira']) {
    assert.equal((await sent(hub, ana, url, content)).statusCode, 200)
    const events = await stream.turn()
    assert.equal(endOf(events), 'complete', content)
    assert.deepEqual(failuresOf(events), [], content)
  }
  assert.equal(said.mock.callCount(), 1)
  assert.equal(said.mock.calls[0]?.arguments[0], 'Error converting tool call input to JSON')
  const replayed = calls.slice(1).map((call) => call.toolUses)
  assert.equal(replayed.length, 3)
  for (const uses of replayed) {
    assert.deepEqual(uses, [
      { name: 'mastra_workspace_write_file', input: WRITE.input },
      { name: 'ask_user', input: {} },
    ])
  }
  const stored = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  const asked = stored.flatMap((part) =>
    part.type === 'tool-invocation' && part.toolInvocation.toolName === 'ask_user'
      ? [part.toolInvocation]
      : [],
  )
  assert.equal(asked.length, 1)
  assert.equal(asked[0]?.state, 'output-error')
  assert.ok(
    !('args' in (asked[0] ?? {})) || asked[0]?.args === undefined,
    'the stored call is not edited: it still holds no arguments',
  )
})

test('uma chamada que falha com tarefas abertas não volta ao modelo: nenhum MODEL_NO_ACCOUNT falso e a versão sem veredito', async (t) => {
  const calls: Sent[] = []
  const { hub, ana, conversations } = await conversing(t, (call): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    calls.push(call)
    return calls.length === 1
      ? { kind: 'blocks', blocks: [TASKS, WRITE] }
      : { kind: 'refuse', status: 400 }
  })
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  assert.equal(endOf(events), 'error')
  const stored = (await messagesOf(hub, ana, url)).flatMap((message) => message.parts)
  const errors = stored.flatMap((part) => (part.type === 'error' ? [JSON.stringify(part)] : []))
  assert.ok(errors.length > 0, 'the failure is stored')
  assert.ok(
    errors.every((error) => !error.includes('MODEL_NO_ACCOUNT')),
    'no false MODEL_NO_ACCOUNT',
  )
  assert.deepEqual(
    versionsOf(partsOf(events)),
    [{ number: 1, changedFiles: 1, check: 'none' }],
    'the turn changed a file, so it made version 1, and a failed turn leaves it without a verdict',
  )
})
