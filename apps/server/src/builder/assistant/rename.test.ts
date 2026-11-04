import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CARLA, call, codeOf, memberOn } from '../../hub/identity/test-hub.ts'
import { endOf, sent, streamOf, title } from '../conversation/test-conversation.ts'
import { assisting, created } from './test-assistant.ts'

test('renomear: o título fica na lista, e um título vazio ou longo demais é REQUEST_MALFORMED (5)', async (t) => {
  const on = await assisting(t)
  const mine = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const renamed = await call(on.hub, on.ana, 'PATCH', mine, { title: '  Pedidos de outubro ' })
  assert.equal(renamed.statusCode, 200, renamed.body)
  assert.equal(Object(renamed.json()).title, 'Pedidos de outubro')
  const read = await call(on.hub, on.ana, 'GET', mine)
  assert.equal(Object(read.json()).conversation.title, 'Pedidos de outubro')
  for (const title of ['   ', 'a'.repeat(121)]) {
    const refused = await call(on.hub, on.ana, 'PATCH', mine, { title })
    assert.deepEqual([refused.statusCode, codeOf(refused)], [400, 'REQUEST_MALFORMED'])
  }
  const hers = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const other = await call(on.hub, hers, 'PATCH', mine, { title: 'De outra pessoa' })
  assert.deepEqual([other.statusCode, codeOf(other)], [404, 'CONVERSATION_NOT_FOUND'])
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
  const renamed = await call(on.hub, on.ana, 'PATCH', mine, { title: 'Pedidos de outubro' })
  assert.equal(renamed.statusCode, 200, renamed.body)

  const stream = await streamOf(on.hub, on.ana, mine)
  t.after(() => stream.close())
  assert.equal((await sent(on.hub, on.ana, mine, LONG)).statusCode, 200)
  assert.equal(endOf(await stream.turn()), 'complete')

  const read = await call(on.hub, on.ana, 'GET', mine)
  assert.equal(Object(read.json()).conversation.title, 'Pedidos de outubro')
})
