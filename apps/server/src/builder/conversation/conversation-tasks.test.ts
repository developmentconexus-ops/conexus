import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { connect, GROQ_MODEL } from '../model-accounts/test-defaults.ts'
import type { StreamEvent } from './test-conversation.ts'
import {
  answeredOf,
  conversing,
  endOf,
  KEY,
  MODEL,
  messagesOf,
  sent,
  started,
  streamOf,
  title,
  turnNotices,
} from './test-conversation.ts'
import { messagesIn, noticesIn } from './test-parts.ts'

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
  assert.equal((await sent(hub, ana, url, 'Crie o app de encomendas')).statusCode, 200)
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

const GROQ = GROQ_MODEL

/** The memory's calls among a provider's: the observer's prompt opens with its identity. */
function observed(calls: Sent[]): Sent[] {
  return calls.filter((each) => OBSERVER.test(each.system))
}

/** Two long answers, each past half the observer's window, so the second turn blocks on observation. */
async function twoLongTurns(
  t: TestContext,
  where: { hub: Hub; person: Person; url: string },
): Promise<StreamEvent[][]> {
  const stream = await streamOf(where.hub, where.person, where.url)
  t.after(() => stream.close())
  const turns: StreamEvent[][] = []
  for (const question of ['Primeira encomenda', 'Segunda encomenda']) {
    assert.equal((await sent(where.hub, where.person, where.url, question)).statusCode, 200)
    turns.push(await stream.turn())
  }
  return turns
}

test('Observador no Groq: a chamada dele chega ao dublê do Groq, e o modelo do turno não muda (14.2, 35)', async (t) => {
  const { hub, ana, conversations, companyId, anthropic } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'text', text: LONG },
  )
  anthropic.chat = () => ({ kind: 'text', text: OBSERVED })
  await connect(hub, ana, `/api/companies/${companyId}/model-accounts`, 'groq')
  const settings = `/api/companies/${companyId}/observational-memory-models`
  const saved = await call(hub, ana, 'PUT', settings, { role: 'observer', model: GROQ })
  assert.equal(saved.statusCode, 200, saved.body)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const turns = await twoLongTurns(t, { hub, person: ana, url })
  for (const events of turns) {
    assert.equal(endOf(events), 'complete')
  }
  assert.ok(observed(anthropic.chats).length > 0, 'the Observer called the Groq double')
  assert.equal(observed(anthropic.sent).length, 0, 'and none reached the conversation’s provider')
  assert.ok(
    anthropic.sent.some((each) => each.stream),
    'the turns ran on the conversation’s model',
  )
  const read = await call(hub, ana, 'GET', url)
  assert.equal(Object(read.json()).conversation.model, MODEL)
})

test('sem conta no modelo escolhido, o Observador segue a conversa, sem aviso, passando de blockAfter (14.2, 36)', async (t) => {
  const { hub, ana, conversations, companyId, anthropic } = await conversing(t, (asked) => {
    if (OBSERVER.test(asked.system)) return { kind: 'text', text: OBSERVED }
    return title(asked) ?? { kind: 'text', text: LONG }
  })
  const accounts = `/api/companies/${companyId}/model-accounts`
  const groq = await connect(hub, ana, accounts, 'groq')
  const settings = `/api/companies/${companyId}/observational-memory-models`
  assert.equal(
    (await call(hub, ana, 'PUT', settings, { role: 'observer', model: GROQ })).statusCode,
    200,
  )
  const removed = await call(hub, ana, 'DELETE', `${accounts}/${groq}`)
  assert.equal(removed.statusCode, 204, removed.body)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const turns = await twoLongTurns(t, { hub, person: ana, url })
  for (const events of turns) assert.equal(endOf(events), 'complete')
  const answers = (await answeredOf(hub, ana, url)).filter((message) => message.role === 'builder')
  assert.deepEqual(noticesIn(answers.flatMap((message) => message.parts)), [])
  assert.equal(anthropic.chats.length, 0, 'no call reached Groq')
  assert.ok(observed(anthropic.sent).length > 0, 'the Observer followed the conversation')
})

test('a conta do Observador falha e o modelo do turno bate no limite: o turno troca de conta como sem o Observador (14.2, 37)', async (t) => {
  let limited = false
  const { hub, ana, conversations, companyId, anthropic, link } = await conversing(t, (asked) => {
    if (limited && asked.key === KEY) return { kind: 'refuse', status: 429 }
    return title(asked) ?? { kind: 'text', text: LONG }
  })
  await link('Time 2', 'sk-ant-conversation-key-0002')
  await connect(hub, ana, `/api/companies/${companyId}/model-accounts`, 'groq')
  anthropic.chat = () => ({ kind: 'refuse', status: 401 })
  const settings = `/api/companies/${companyId}/observational-memory-models`
  assert.equal(
    (await call(hub, ana, 'PUT', settings, { role: 'observer', model: GROQ })).statusCode,
    200,
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  for (const question of ['Primeira encomenda', 'Segunda encomenda', 'Terceira encomenda']) {
    limited = question.startsWith('Terceira')
    assert.equal((await sent(hub, ana, url, question)).statusCode, 200)
    const events = await stream.turn()
    assert.equal(endOf(events), 'complete')
  }
  // Mastra's stream leaves out the answer's data parts: the notice is read with the answer.
  const notices = await turnNotices(hub, ana, url)
  assert.equal(notices.length, 1, notices.join(' | '))
  assert.match(notices[0] ?? '', /continuei pela Time 2/)
  assert.ok(anthropic.chats.length > 0, 'the Observer’s account was called, and failed')
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
    assert.equal((await sent(hub, ana, url, question)).statusCode, 200)
    assert.equal(endOf(await stream.turn()), 'complete')
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
function shown(part: MastraMessagePart): string[] {
  if (part.type === 'tool-invocation') return [part.toolInvocation.toolName]
  return part.type.startsWith('data-') || part.type === 'step-start' ? [] : [part.type]
}

/** Each message the stream began, by id, folded as the screen folds it, in the order they began. */
function liveMessages(events: StreamEvent[]): Map<string, string[]> {
  return new Map([...messagesIn(events)].map(([id, message]) => [id, message.parts.flatMap(shown)]))
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
  assert.equal((await sent(hub, ana, url, 'Liste')).statusCode, 200)
  const events = await stream.turn()
  assert.equal(endOf(events), 'complete')
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
