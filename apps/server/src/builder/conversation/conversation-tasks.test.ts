import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ConversationEvent, MastraPart } from '@conexus/hub-api'
import { applyUpdate } from '@conexus/hub-api'
import { call } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { conversing, messagesOf, sent, started, streamOf, title } from './test-conversation.ts'
import { connect } from './test-defaults.ts'

const OBSERVER = /^You are the memory consciousness/
const SNAPSHOT = '<current-task-list'
const PLANNED = [
  { content: 'Tabela de encomendas', activeForm: 'Criando a tabela', status: 'completed' },
  { content: 'Tela de encomendas', activeForm: 'Fazendo a tela', status: 'completed' },
]
const TASKS = { type: 'tool_use', name: 'task_write', input: { tasks: PLANNED } } as const
/** An answer past half the observer's window (`messageTokens`), so two of them block on observation. */
const LONG = 'As encomendas da padaria chegam pelo telefone e pelo balcão. '.repeat(3000)
const OBSERVED = [
  '<observations>',
  '* 🔴 (10:00) Ana quer um app de encomendas da padaria, com a tabela e a tela feitas.',
  '</observations>',
  '<thread-title>Encomendas da padaria</thread-title>',
].join('\n')

/** Whether a call still carries the `task_write` call's own result. */
function heldTheCall(call: Sent): boolean {
  return call.texts.some(
    (text) => text.includes('Tabela de encomendas') && !text.includes(SNAPSHOT),
  )
}

test('o Builder sai de createCodingAgent sem workspace próprio: as ferramentas de tarefa, e a máquina emprestada pela volta (14.2, 14)', async (t) => {
  const calls: Sent[] = []
  const { hub, ana, conversations } = await conversing(t, (call): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    calls.push(call)
    return calls.length === 1
      ? { kind: 'blocks', blocks: [TASKS] }
      : { kind: 'text', text: 'Pronto.' }
  })
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Crie o app de encomendas')).statusCode, 202)
  await stream.turn()
  const [first, second] = calls
  for (const name of ['task_write', 'task_update', 'task_complete', 'task_check']) {
    assert.ok(first?.tools.includes(name), name)
  }
  assert.ok(first?.tools.includes('mastra_workspace_write_file'), 'the turn lent its machine')
  assert.equal(first?.system.includes(process.cwd()), false, 'no workspace of its own on the host')
  assert.ok(
    second?.texts.some((text) => text.includes(SNAPSHOT)),
    'the list rides the state lane',
  )
})

test('o Observer usa o modelo explícito da empresa pela fila de contas, sem mudar o modelo da conversa', async (t) => {
  const { hub, ana, conversations, companyId, anthropic } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'text', text: LONG },
  )
  await connect(hub, ana, `/api/companies/${companyId}/model-accounts`, 'groq')
  const settings = `/api/companies/${companyId}/observational-memory-models`
  const chosen = 'groq/llama-3.3-70b-versatile'
  const saved = await call(hub, ana, 'PUT', settings, { role: 'observer', model: chosen })
  assert.equal(saved.statusCode, 200, saved.body)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  for (const question of ['Primeira encomenda', 'Segunda encomenda']) {
    assert.equal((await sent(hub, ana, url, question)).statusCode, 202)
    assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  }
  await hub.close()
  assert.ok(anthropic.chats.length > 0, 'the Observer called the selected Groq account')
})

test('a lista volta ao modelo depois que a chamada de task_write sai da janela pela memória (14.2, 14)', async (t) => {
  const calls: Sent[] = []
  const observed: Sent[] = []
  const { hub, ana, conversations } = await conversing(t, (call): Reply => {
    if (OBSERVER.test(call.system)) {
      observed.push(call)
      return { kind: 'text', text: OBSERVED }
    }
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    calls.push(call)
    if (calls.length === 1) return { kind: 'blocks', blocks: [TASKS] }
    return { kind: 'text', text: LONG }
  })
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  for (const question of ['Crie o app de encomendas', 'Explique as encomendas', 'E agora?']) {
    assert.equal((await sent(hub, ana, url, question)).statusCode, 202)
    assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  }
  assert.ok(observed.length > 0, 'the conversation was observed')
  const last = calls.at(-1)
  assert.ok(last !== undefined && !heldTheCall(last), 'the task_write call left the window')
  assert.ok(
    last.texts.some((text) => text.includes(SNAPSHOT)),
    'and the list came back to the model',
  )
})

/** What a part says on the screen: its kind, or its tool's name. Mastra's own bookkeeping parts are left out. */
function shown(part: MastraPart): string[] {
  if (part.type === 'tool-invocation') return [part.toolInvocation.toolName]
  return part.type.startsWith('data-') ? [] : [part.type]
}

/** Each message the stream began, by id, folded as the screen folds it, in the order they began. */
function liveMessages(events: ConversationEvent[]): Map<string, string[]> {
  const parts = new Map<string, MastraPart[]>()
  for (const event of events) {
    if (event.type === 'message_start') parts.set(event.message.id, event.message.parts)
    else if (event.type === 'message_update') {
      parts.set(event.id, applyUpdate(parts.get(event.id) ?? [], event.event))
    }
  }
  return new Map([...parts].map(([id, all]) => [id, all.flatMap(shown)]))
}

function write(status: string) {
  const tasks = [{ content: 'Listar', activeForm: 'Listando', status }]
  return { type: 'tool_use', name: 'task_write', input: { tasks } } as const
}
const LIST = {
  type: 'tool_use',
  name: 'mastra_workspace_list_files',
  input: { path: '.' },
} as const

test('ao vivo e relido, a mesma parte: o raciocínio e a primeira task_write de um turno com tarefas e ferramenta do espaço de trabalho voltam, nas mesmas mensagens (14.2, 4)', async (t) => {
  const script: Reply[] = [
    {
      kind: 'blocks',
      blocks: [{ type: 'thinking', thinking: 'Vou listar.' }, write('in_progress')],
    },
    { kind: 'blocks', blocks: [LIST] },
    { kind: 'blocks', blocks: [write('completed')] },
    { kind: 'blocks', blocks: [] },
  ]
  let at = 0
  const { hub, ana, conversations } = await conversing(t, (asked): Reply => {
    if (title(asked) !== undefined) return { kind: 'text', text: 'Título' }
    if (!asked.system.includes('You are the Conexus Builder')) return { kind: 'text', text: 'Obs' }
    return script[at++] ?? { kind: 'blocks', blocks: [] }
  })
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Liste')).statusCode, 202)
  const events = await stream.turn()
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  const live = liveMessages(events)
  const reread = new Map<string, string[]>(
    (await messagesOf(hub, ana, url))
      .filter((message) => message.role === 'builder')
      .map((message) => [message.id, message.parts.flatMap(shown)]),
  )
  const lived = [...live.values()].flat()
  for (const part of ['reasoning', 'task_write', 'mastra_workspace_list_files']) {
    assert.ok(lived.includes(part), `the stream said ${part}`)
  }
  for (const [id, parts] of live) {
    if (parts.length > 0) assert.deepEqual(reread.get(id), parts, `message ${id}`)
  }
})
