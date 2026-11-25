import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf, sent, streamOf, title } from '../../harness/routes/test-conversation.ts'
import { renamed } from '../../harness/routes/test-questions.ts'
import { call } from '../../hub/identity/test-hub.ts'
import { assisting, created } from './test-assistant.ts'

test('renomear: o título aparado fica na lista da pessoa (5)', async (t) => {
  const on = await assisting(t)
  const mine = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const done = await renamed(on.hub, on.ana, mine, '  Pedidos de outubro ')
  assert.equal(done.statusCode, 200, done.body)
  const read = await call(on.hub, on.ana, 'GET', mine)
  assert.equal(Object(read.json()).conversation.title, 'Pedidos de outubro')
  const list = await call(on.hub, on.ana, 'GET', on.assistant)
  const titles = Object(list.json()).conversations.map((one: { title: string }) => one.title)
  assert.deepEqual(titles, ['Pedidos de outubro'])
})

test('renomear: a conversa de um Projeto continua no Projeto, porque a marca fixa o título sem trocar as outras (5)', async (t) => {
  const on = await assisting(t)
  const mine = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [],
  })
  const done = await renamed(on.hub, on.ana, mine, 'Pedidos de outubro')
  assert.equal(done.statusCode, 200, done.body)
  const read = await call(on.hub, on.ana, 'GET', mine)
  assert.equal(Object(read.json()).conversation.projectId, on.projectId)
})

const LONG = 'As encomendas da padaria chegam pelo telefone e pelo balcão. '.repeat(3000)
const OBSERVED = [
  '<observations>',
  '* 🔴 (10:00) Ana quer um app de encomendas da padaria.',
  '</observations>',
  '<thread-title>Encomendas da padaria</thread-title>',
].join('\n')

test('renomear: o título renomeado fica fixo depois de uma volta em que o observador gera outro (5)', {
  timeout: 60_000,
}, async (t) => {
  const on = await assisting(t, (asked) => {
    if (asked.texts.some((text) => text.includes('New Message History to Observe'))) {
      return { kind: 'text', text: OBSERVED }
    }
    return title(asked) ?? { kind: 'text', text: 'Pronto.' }
  })
  const mine = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const done = await renamed(on.hub, on.ana, mine, 'Pedidos de outubro')
  assert.equal(done.statusCode, 200, done.body)

  const stream = await streamOf(on.hub, on.ana, mine)
  t.after(() => stream.close())
  assert.equal((await sent(on.hub, on.ana, mine, LONG)).statusCode, 200)
  assert.equal(endOf(await stream.turn()), 'complete')

  const read = await call(on.hub, on.ana, 'GET', mine)
  assert.equal(Object(read.json()).conversation.title, 'Pedidos de outubro')
})
