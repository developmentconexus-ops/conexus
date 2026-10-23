import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { conversing, sent, started, streamOf, title } from './test-conversation.ts'

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
