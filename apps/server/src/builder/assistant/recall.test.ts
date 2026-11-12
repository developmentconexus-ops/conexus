import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BRUNO, call, memberOn, plantCompany, post } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { endOf, KEY, MODEL, started } from '../conversation/test-conversation.ts'
import { stepped, tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

const FOLLOWED = 'Acompanho a linha de bebidas.'

/** The conversation's id at the end of its Hub URL. */
function idOf(url: string) {
  return url.slice(url.lastIndexOf('/') + 1)
}

/** What the model received back from its last tool call, as the next call to it carries it. */
function lastResult(asked: Sent | undefined) {
  return asked?.texts.at(-1) ?? ''
}

test('lê as suas conversas', async (t) => {
  let earlier = ''
  const on = await assisting(
    t,
    stepped([
      () => [said('Anotado.')],
      () => [tool('recall', { mode: 'threads' })],
      () => [tool('recall', { mode: 'messages', threadId: earlier })],
      () => [said('Você acompanha a linha de bebidas.')],
    ]),
  )
  const before = await created(on.hub, on.ana, on.assistant, { connections: [] })
  earlier = idOf(before)
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, before)).say(FOLLOWED)), 'complete')

  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const his = idOf(await created(on.hub, bruno, on.assistant, { connections: [] }))
  const builder = await started(on.hub, on.ana, on.conversations)
  const other = `/api/companies/${await plantCompany(on.hub.test, on.ana.id, 'Outra Empresa')}`
  const account = { owner: 'company', provider: 'anthropic', label: 'Outra', key: KEY }
  assert.equal((await post(on.hub, on.ana, `${other}/model-accounts`, account)).statusCode, 201)
  const model = { model: MODEL, effort: 'off' }
  assert.equal((await call(on.hub, on.ana, 'PUT', `${other}/default-model`, model)).statusCode, 200)
  const elsewhere = idOf(
    await created(on.hub, on.ana, `${other}/assistant/conversations`, { connections: [] }),
  )

  const now = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, now)
  assert.equal(endOf(await say('O que eu falei que acompanho?')), 'complete')

  const listed = lastResult(on.calls.at(2))
  assert.ok(listed.includes(`id: ${earlier}`), listed)
  assert.ok(listed.includes(`id: ${idOf(now)}`), 'the current one is listed, marked')
  assert.ok(!listed.includes(his), 'never another person’s')
  assert.ok(!listed.includes(builder), 'never the Builder’s')
  assert.ok(!listed.includes(elsewhere), 'never another company’s')
  const read = lastResult(on.calls.at(3))
  assert.ok(read.includes(FOLLOWED), read)
})

test('não lê a de outro', async (t) => {
  const others: string[] = []
  const on = await assisting(
    t,
    stepped([
      () => others.map((threadId) => tool('recall', { mode: 'messages', threadId })),
      () => [said('Não achei.')],
    ]),
  )
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const his = await created(on.hub, bruno, on.assistant, { connections: [] })
  others.push(idOf(his), await started(on.hub, on.ana, on.conversations))

  const mine = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, mine)).say('E a do Bruno?')), 'complete')

  const refused = (on.calls.at(1)?.texts ?? []).filter((text) =>
    text.includes('Thread does not belong to the active resource'),
  )
  assert.equal(refused.length, 2, String(on.calls.at(1)?.texts))
})
