import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  BRUNO,
  CARLA,
  call,
  codeOf,
  companyOn,
  memberOn,
  post,
} from '../../hub/identity/test-hub.ts'
import { asked, conversing, MODEL } from '../conversation/test-conversation.ts'
import { failuresOf, noticesOf } from '../conversation/test-parts.ts'
import { GROQ_MODEL } from './test-defaults.ts'

const FIRST = 'anthropic/claude-sonnet-4-6'
const SECOND = 'google/gemini-2.5-flash'

/** Ana owns the company, Bruno administers it, Carla is a member. */
async function company(t: Parameters<typeof companyOn>[0]) {
  const { hub, ana, companyId } = await companyOn(t)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const base = `/api/companies/${companyId}`
  async function read(who = ana) {
    return Object(Object((await call(hub, who, 'GET', `${base}/model-accounts`)).json()).fallback)
  }
  return { hub, ana, bruno, carla, read, url: `${base}/model-fallback` }
}

test('troca automática: começa desligada; dono e administrador gravam na revisão lida; membro 404', async (t) => {
  const { hub, ana, bruno, carla, read, url } = await company(t)
  assert.deepEqual(await read(carla), { enabled: false, chain: [], revision: 0 })
  const first = await call(hub, ana, 'PUT', url, {
    enabled: true,
    chain: [FIRST, SECOND],
    revision: 0,
  })
  assert.deepEqual(
    [first.statusCode, first.json()],
    [200, { enabled: true, chain: [FIRST, SECOND], revision: 1 }],
  )
  const second = await call(hub, bruno, 'PUT', url, {
    enabled: false,
    chain: [SECOND],
    revision: 1,
  })
  assert.deepEqual(
    [second.statusCode, second.json()],
    [200, { enabled: false, chain: [SECOND], revision: 2 }],
  )
  assert.deepEqual(await read(carla), { enabled: false, chain: [SECOND], revision: 2 })
  const denied = await call(hub, carla, 'PUT', url, { enabled: true, chain: [], revision: 2 })
  assert.deepEqual([denied.statusCode, codeOf(denied)], [404, 'NOT_FOUND'])
  // The admission comes before the models' check: a member learns nothing from a wrong model.
  const hidden = await call(hub, carla, 'PUT', url, {
    enabled: true,
    chain: ['nenhum/x'],
    revision: 2,
  })
  assert.equal(hidden.statusCode, 404)
  assert.deepEqual(await read(), { enabled: false, chain: [SECOND], revision: 2 })
})

test('troca automática: modelo fora do registro dá 422 MODEL_UNKNOWN e nada muda', async (t) => {
  const { hub, ana, read, url } = await company(t)
  for (const chain of [['nenhum/x'], [FIRST, 'anthropic/claude-nenhum'], ['claude-sonnet-4-6']]) {
    const refused = await call(hub, ana, 'PUT', url, { enabled: true, chain, revision: 0 })
    assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'MODEL_UNKNOWN'], `${chain}`)
  }
  assert.deepEqual(await read(), { enabled: false, chain: [], revision: 0 })
})

test('troca automática: revisão velha dá 412; duas gravações juntas, uma vence', async (t) => {
  const { hub, ana, bruno, read, url } = await company(t)
  const body = { enabled: true, chain: [FIRST], revision: 0 }
  const [one, two] = await Promise.all([
    call(hub, ana, 'PUT', url, body),
    call(hub, bruno, 'PUT', url, body),
  ])
  assert.deepEqual([one.statusCode, two.statusCode].sort(), [200, 412])
  const lost = one.statusCode === 412 ? one : two
  assert.equal(codeOf(lost), 'MODEL_FALLBACK_STALE')
  const stale = await call(hub, ana, 'PUT', url, { enabled: false, chain: [], revision: 0 })
  assert.deepEqual([stale.statusCode, codeOf(stale)], [412, 'MODEL_FALLBACK_STALE'])
  const missed = await call(hub, ana, 'PUT', url, { enabled: false, chain: [], revision: 5 })
  assert.equal(missed.statusCode, 412)
  assert.deepEqual(await read(), { enabled: true, chain: [FIRST], revision: 1 })
})

const GROQ = GROQ_MODEL

test('troca ligada: a fila acabou, o próximo modelo responde com aviso e sem busca; a seguinte tenta o escolhido; desligada, para', async (t) => {
  const limited: { on: boolean } = { on: true }
  const { hub, ana, companyId, conversations, anthropic } = await conversing(t, (each) =>
    limited.on && each.stream ? { kind: 'refuse', status: 429 } : { kind: 'text', text: 'Pronto.' },
  )
  const company = `/api/companies/${companyId}`
  const groq = { owner: 'company', provider: 'groq', label: 'Groq 1', key: 'gsk-fallback-key-0001' }
  assert.equal((await post(hub, ana, `${company}/model-accounts`, groq)).statusCode, 201)
  const url = `${company}/model-fallback`
  const on = await call(hub, ana, 'PUT', url, { enabled: true, chain: [MODEL, GROQ], revision: 0 })
  assert.equal(on.statusCode, 200)
  function streamedChats() {
    return anthropic.chats.filter((each) => each.stream)
  }
  const where = { hub, person: ana, conversations }
  const first = await asked(t, where)
  const switched = `Troquei para ${GROQ.slice('groq/'.length)} pela troca automática da empresa.`
  assert.deepEqual(noticesOf(first.events), [switched])
  assert.deepEqual(first.events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.deepEqual(
    anthropic.sent.filter((each) => each.stream).map((each) => each.tools.includes('web_search')),
    [true],
  )
  assert.equal(streamedChats().length, 1)
  assert.equal(streamedChats()[0]?.bearer, groq.key)
  assert.ok(streamedChats()[0]?.tools.includes('web_fetch'))
  assert.ok(!streamedChats()[0]?.tools.includes('web_search'))
  limited.on = false
  await hub.test.asOwner(`update builder.model_account set limited_until = null`)
  const second = await asked(t, where)
  assert.deepEqual(noticesOf(second.events), [])
  assert.equal(streamedChats().length, 1)
  assert.deepEqual(
    anthropic.sent.filter((each) => each.stream).map((each) => each.tools.includes('web_search')),
    [true, true],
  )
  limited.on = true
  await hub.test.asOwner(`update builder.model_account set limited_until = null`)
  const off = await call(hub, ana, 'PUT', url, {
    enabled: false,
    chain: [MODEL, GROQ],
    revision: 1,
  })
  assert.equal(off.statusCode, 200)
  const third = await asked(t, where)
  assert.match(noticesOf(third.events).at(-1) ?? '', /^Time 1 no limite até \d{2}h\d{2}\.$/)
  assert.ok(!noticesOf(third.events).some((text) => text.startsWith('Troquei')))
  assert.deepEqual(failuresOf(third.events), ['MODEL_NO_ACCOUNT'])
  assert.deepEqual(third.events.at(-1), { type: 'turnEnd', reason: 'error' })
  assert.equal(streamedChats().length, 1)
})
