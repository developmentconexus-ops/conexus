import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { call, codeOf, memberOn, plantCompany, post } from '../identity/test-hub.ts'
import { bellOf, endedRun, notifying } from './test-notifications.ts'

const BIA = { name: 'Bia Souza', email: 'bia@example.test' }

test('o aviso: a falha antes do turno avisa sem conversa; a pausa não leva conversa nem código; o passo repetido não duplica', async (t) => {
  const on = await notifying(t)
  const before = endedRun(on, {
    outcome: { kind: 'FAILED', code: 'MODEL_NO_ACCOUNT', conversationId: null },
  })
  const paused = endedRun(on, { outcome: { kind: 'SKIPPED', reason: 'OWNER_CANNOT_ASK' } })
  for (const ran of [before, paused, before, paused, before]) await on.hub.notify.automationRan(ran)
  const { notifications } = await bellOf(on.hub, on.ana, on.company)
  assert.deepEqual(
    notifications.map((each) => [each.kind, each.code ?? null, each.conversationId ?? null]),
    [
      ['AUTOMATION_PAUSED', null, null],
      ['AUTOMATION_FAILED', 'MODEL_NO_ACCOUNT', null],
    ],
  )
  assert.equal(on.mail.sent.length, 2, 'uma por execução, e o e-mail só da gravação nova')
})

test('o sino: só as da pessoa, da mais nova para a mais velha, 30 por página, com as não lidas; marcar lê só as dela', async (t) => {
  const on = await notifying(t)
  const bia = await memberOn(on.hub, on.companyId, BIA, 'member')
  const other = await plantCompany(on.hub.test, on.ana.id, 'Outra Empresa')
  const mine = Array.from({ length: 31 }, () => endedRun(on, { trigger: 'MANUAL' }))
  for (const ran of mine) await on.hub.notify.automationRan(ran)
  await on.hub.notify.automationRan(
    endedRun({ companyId: other, ana: on.ana }, { trigger: 'MANUAL' }),
  )
  await on.hub.notify.automationRan(
    endedRun({ companyId: on.companyId, ana: bia }, { trigger: 'MANUAL' }),
  )

  const first = await bellOf(on.hub, on.ana, on.company)
  assert.equal(first.notifications.length, 30)
  assert.equal(first.unread, 31)
  assert.deepEqual(
    first.notifications.map((each) => each.automation.id),
    mine
      .toReversed()
      .slice(0, 30)
      .map((ran) => ran.automationId),
  )
  assert.equal(first.next.kind, 'MORE')
  const page = first.next.kind === 'MORE' ? first.next.page : ''
  const second = await bellOf(on.hub, on.ana, on.company, page)
  assert.deepEqual(
    second.notifications.map((each) => each.automation.id),
    [mine[0]?.automationId],
  )
  assert.deepEqual(second.next, { kind: 'END' })
  const tampered = await call(
    on.hub,
    on.ana,
    'GET',
    `${on.company}/notifications?page=${Buffer.from('x').toString('base64url')}`,
  )
  assert.deepEqual([tampered.statusCode, codeOf(tampered)], [400, 'REQUEST_MALFORMED'])
})

test('o sino: marcar lê só as da pessoa, as nomeadas ou todas; repetir não muda nada', async (t) => {
  const on = await notifying(t)
  const bia = await memberOn(on.hub, on.companyId, BIA, 'member')
  const other = await plantCompany(on.hub.test, on.ana.id, 'Outra Empresa')
  for (const ran of [endedRun(on), endedRun(on), endedRun(on)])
    await on.hub.notify.automationRan(ran)
  await on.hub.notify.automationRan(endedRun({ companyId: other, ana: on.ana }))
  await on.hub.notify.automationRan(endedRun({ companyId: on.companyId, ana: bia }))
  const read = `${on.company}/notifications/read`

  const biasOwn = (await bellOf(on.hub, bia, on.company)).notifications.map((each) => each.id)
  assert.equal(biasOwn.length, 1, 'um membro lê as suas')
  assert.equal((await post(on.hub, on.ana, read, { ids: biasOwn })).statusCode, 204)
  assert.equal((await bellOf(on.hub, bia, on.company)).unread, 1, 'a de outra pessoa não é marcada')

  const [newest] = (await bellOf(on.hub, on.ana, on.company)).notifications
  assert.equal((await post(on.hub, on.ana, read, { ids: [newest?.id] })).statusCode, 204)
  const afterSome = await bellOf(on.hub, on.ana, on.company)
  assert.equal(afterSome.unread, 2)
  assert.deepEqual(
    afterSome.notifications.map((each) => each.read),
    [true, false, false],
  )
  assert.equal((await post(on.hub, on.ana, read, { ids: [newest?.id] })).statusCode, 204)
  assert.equal((await bellOf(on.hub, on.ana, on.company)).unread, 2)

  assert.equal((await post(on.hub, on.ana, read, { all: true })).statusCode, 204)
  assert.equal((await bellOf(on.hub, on.ana, on.company)).unread, 0)
  assert.equal((await bellOf(on.hub, bia, on.company)).unread, 1, 'marcar todas é só das dela')
  const elsewhere = await bellOf(on.hub, on.ana, `/api/companies/${other}`)
  assert.equal(elsewhere.unread, 1, 'a de outra empresa não é marcada')
})

test('o sino: quem não é da empresa recebe NOT_FOUND, e uma marcação inválida REQUEST_MALFORMED', async (t) => {
  const on = await notifying(t)
  const stranger = await memberOn(
    on.hub,
    await plantCompany(on.hub.test, on.ana.id, 'Outra Empresa'),
    BIA,
    'member',
  )
  const listed = await call(on.hub, stranger, 'GET', `${on.company}/notifications`)
  assert.deepEqual([listed.statusCode, codeOf(listed)], [404, 'NOT_FOUND'])
  const marked = await post(on.hub, stranger, `${on.company}/notifications/read`, { all: true })
  assert.deepEqual([marked.statusCode, codeOf(marked)], [404, 'NOT_FOUND'])
  for (const body of [
    {},
    { ids: [] },
    { all: false },
    { ids: ['x'] },
    { ids: [randomUUID()], all: true },
  ]) {
    const refused = await post(on.hub, on.ana, `${on.company}/notifications/read`, body)
    assert.deepEqual(
      [refused.statusCode, codeOf(refused)],
      [400, 'REQUEST_MALFORMED'],
      JSON.stringify(body),
    )
  }
})

test('a remoção: as notificações saem com a pessoa e com a empresa', async (t) => {
  const on = await notifying(t)
  const bia = await memberOn(on.hub, on.companyId, BIA, 'member')
  const other = await plantCompany(on.hub.test, on.ana.id, 'Outra Empresa')
  await on.hub.notify.automationRan(endedRun(on))
  await on.hub.notify.automationRan(endedRun({ companyId: on.companyId, ana: bia }))
  await on.hub.notify.automationRan(endedRun({ companyId: other, ana: on.ana }))
  function count() {
    return on.hub.test.asOwner('select count(*)::int as n from notifications.notification')
  }
  assert.deepEqual(await count(), [{ n: 3 }])
  await on.hub.test.asOwner('delete from auth.member where company_id = $1 and user_id = $2', [
    on.companyId,
    bia.id,
  ])
  assert.deepEqual(await count(), [{ n: 2 }])
  await on.hub.test.asOwner('delete from auth.member where company_id = $1', [other])
  await on.hub.test.asOwner('delete from auth.company where id = $1', [other])
  assert.deepEqual(await count(), [{ n: 1 }])
})
