import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { call, memberOn, personOn } from '../identity/test-hub.ts'
import { pedidos, refusal } from './test-requests.ts'

const FABIO = { name: 'Fábio Nunes', email: 'fabio@example.test' }

test('pedir, quem é avisado e cancelar', async (t) => {
  const on = await pedidos(t, 2)
  const { ana, bruno, carla, diego } = on
  assert.equal((await on.publish(ana, 1)).statusCode, 200)

  await t.test('pedir', async () => {
    const key = randomUUID()
    const first = await on.ask(bruno, 2, 'pronta para a loja', key)
    assert.equal(first.statusCode, 201, first.body)
    const made = Object(first.json()).request
    assert.deepEqual(
      [made.number, made.message, made.requestedBy, made.mayDecide, made.mayCancel],
      [2, 'pronta para a loja', { name: 'Bruno Reis' }, false, true],
    )
    const again = await on.ask(bruno, 2, 'pronta para a loja', key)
    assert.deepEqual([again.statusCode, again.json()], [201, first.json()])
    assert.deepEqual(refusal(await on.ask(bruno, 2, 'outra', key)), [409, 'IDEMPOTENCY_CONFLICT'])
    assert.deepEqual(refusal(await on.ask(bruno, 2, 'x'.repeat(281))), [400, 'REQUEST_MALFORMED'])
    assert.deepEqual(refusal(await on.ask(bruno, 9)), [404, 'APP_VERSION_NOT_FOUND'])
    assert.deepEqual(refusal(await on.ask(bruno, 1)), [409, 'PUBLISH_REQUEST_ALREADY_LIVE'])
    assert.deepEqual(refusal(await on.ask(bruno, 2)), [409, 'PUBLISH_REQUEST_ALREADY_OPEN'])
    for (const who of [ana, carla, diego])
      assert.deepEqual(refusal(await on.ask(who, 2)), [409, 'PUBLISH_REQUEST_NOT_NEEDED'])
    const outsider = await personOn(on.hub, { name: 'Eva Prado', email: 'eva@example.test' })
    assert.deepEqual(refusal(await on.ask(outsider, 2)), [404, 'NOT_FOUND'])
    assert.deepEqual(await on.requests(), [
      { number: 2, state: 'PENDING', reason: null, decided_by: null },
    ])
  })

  await t.test('quem é avisado', async () => {
    const opened = {
      kind: 'REQUEST_OPENED',
      projectName: 'Pedidos',
      number: 2,
      requestedBy: { name: 'Bruno Reis' },
    }
    assert.deepEqual(await on.notices(ana), [opened])
    assert.deepEqual(await on.notices(carla), [opened])
    assert.deepEqual(await on.notices(bruno), [])
    assert.deepEqual(await on.notices(diego), [])
  })

  await t.test('cancelar', async () => {
    const [open] = await on.hub.test.asOwner(
      `select id from requests.request where state = 'PENDING'`,
    )
    const requestId = String(Object(open).id)
    for (const who of [carla, diego])
      assert.deepEqual(refusal(await on.cancel(who, requestId)), [404, 'NOT_FOUND'])
    assert.equal((await on.cancel(bruno, requestId)).statusCode, 204)
    assert.deepEqual(await on.requests(), [
      { number: 2, state: 'CANCELLED', reason: null, decided_by: null },
    ])
    assert.deepEqual(await on.notices(bruno), [])
    assert.equal((await on.notices(ana)).length, 1)
    assert.deepEqual(refusal(await on.cancel(bruno, requestId)), [409, 'PUBLISH_REQUEST_CLOSED'])
    // Another person gets the same not-found for a closed request as for an open one (S10).
    assert.deepEqual(refusal(await on.cancel(carla, requestId)), [404, 'NOT_FOUND'])
  })
})

test('decidir, quem decide e aprovar o que não publica', async (t) => {
  const on = await pedidos(t, 3)
  const { ana, bruno, carla, diego } = on

  await t.test('decidir', async () => {
    const two = await on.asked(bruno, 2, 'pronta para a loja')
    const approved = await on.decide(ana, two, { decision: 'APPROVE' })
    assert.deepEqual([approved.statusCode, approved.json()], [200, { state: 'APPROVED' }])
    assert.equal(await on.published(), 2)
    const three = await on.asked(bruno, 3)
    const long = { decision: 'DECLINE', reason: 'x'.repeat(281) }
    assert.deepEqual(refusal(await on.decide(carla, three, long)), [400, 'REQUEST_MALFORMED'])
    const declined = await on.decide(carla, three, { decision: 'DECLINE', reason: 'falta o logo' })
    assert.deepEqual([declined.statusCode, declined.json()], [200, { state: 'DECLINED' }])
    assert.equal(await on.published(), 2)
    assert.deepEqual(await on.requests(), [
      { number: 2, state: 'APPROVED', reason: null, decided_by: 'Ana Lima' },
      { number: 3, state: 'DECLINED', reason: 'falta o logo', decided_by: 'Carla Dias' },
    ])
    const decided = { kind: 'REQUEST_DECIDED', projectName: 'Pedidos' }
    assert.deepEqual(await on.notices(bruno), [
      { ...decided, number: 2, outcome: 'APPROVED', decidedBy: { name: 'Ana Lima' }, reason: null },
      {
        ...decided,
        number: 3,
        outcome: 'DECLINED',
        decidedBy: { name: 'Carla Dias' },
        reason: 'falta o logo',
      },
    ])
  })

  await t.test('quem decide', async () => {
    const three = await on.asked(bruno, 3)
    for (const who of [diego, bruno])
      assert.deepEqual(refusal(await on.decide(who, three, { decision: 'APPROVE' })), [
        404,
        'NOT_FOUND',
      ])
    await on.role(bruno, 'admin')
    const own = await on.decide(bruno, three, { decision: 'APPROVE' })
    assert.deepEqual(refusal(own), [409, 'PUBLISH_REQUEST_OWN'])
    await on.role(bruno, 'member')
    assert.equal((await on.decide(ana, three, { decision: 'DECLINE' })).statusCode, 200)
    const closed = await on.decide(carla, three, { decision: 'APPROVE' })
    assert.deepEqual(refusal(closed), [409, 'PUBLISH_REQUEST_CLOSED'])
    const ghost = await on.decide(ana, randomUUID(), { decision: 'APPROVE' })
    assert.deepEqual(refusal(ghost), [404, 'NOT_FOUND'])
    const [declined] = await on.notices(bruno).then((rows) => rows.slice(-1))
    assert.deepEqual(declined, {
      kind: 'REQUEST_DECIDED',
      projectName: 'Pedidos',
      number: 3,
      outcome: 'DECLINED',
      decidedBy: { name: 'Ana Lima' },
      reason: null,
    })
  })

  await t.test('aprovar o que não publica', async () => {
    const three = await on.asked(bruno, 3)
    const before = (await on.notices(bruno)).length
    await on.hub.test.asOwner(
      `update apps.app_version set manifest = jsonb_set(manifest, '{connectors}',
         '[{"connector":"sankhya","operations":["empresas"]}]') where number = 3`,
    )
    const refused = await on.decide(ana, three, { decision: 'APPROVE' })
    assert.deepEqual(refusal(refused), [409, 'CONNECTOR_NOT_GRANTED'])
    assert.equal(await on.published(), 2)
    const [last] = (await on.requests()).slice(-1)
    assert.deepEqual(last, { number: 3, state: 'PENDING', reason: null, decided_by: null })
    assert.equal((await on.notices(bruno)).length, before)
  })
})

test('recusar sem motivo', async (t) => {
  const on = await pedidos(t, 1)
  const { bruno, carla } = on
  // A blank reason is no reason: the bell ends the sentence at the version (criterion 20).
  const blank = await on.decide(carla, await on.asked(bruno, 1), {
    decision: 'DECLINE',
    reason: ' ',
  })
  assert.equal(blank.statusCode, 200, blank.body)
  assert.deepEqual(await on.requests(), [
    { number: 1, state: 'DECLINED', reason: null, decided_by: 'Carla Dias' },
  ])
})

test('publicar com um pedido aberto', async (t) => {
  const on = await pedidos(t, 3)
  const { ana, bruno, diego } = on
  await on.asked(bruno, 2)
  assert.equal((await on.publish(diego, 2)).statusCode, 200)
  await on.asked(bruno, 3)
  assert.equal((await on.publish(diego, 1)).statusCode, 200)
  await on.asked(bruno, 3)
  // Publishing the published version again changes nothing: the request stays open.
  assert.equal((await on.publish(ana, 1)).statusCode, 200)
  assert.deepEqual(await on.requests(), [
    { number: 2, state: 'APPROVED', reason: null, decided_by: 'Diego Reis' },
    { number: 3, state: 'SUPERSEDED', reason: null, decided_by: 'Diego Reis' },
    { number: 3, state: 'PENDING', reason: null, decided_by: null },
  ])
  const decided = { kind: 'REQUEST_DECIDED', projectName: 'Pedidos', reason: null }
  assert.deepEqual(await on.notices(bruno), [
    { ...decided, number: 2, outcome: 'APPROVED', decidedBy: { name: 'Diego Reis' } },
    { ...decided, number: 3, outcome: 'SUPERSEDED', decidedBy: { name: 'Diego Reis' } },
  ])
  // Who closes their own request is not told.
  await on.role(bruno, 'developer')
  assert.equal((await on.publish(bruno, 3)).statusCode, 200)
  const [last] = (await on.requests()).slice(-1)
  assert.deepEqual(last, { number: 3, state: 'APPROVED', reason: null, decided_by: 'Bruno Reis' })
  assert.equal((await on.notices(bruno)).length, 2)
})

test('quem sai', async (t) => {
  const on = await pedidos(t, 2)
  const { hub, ana, bruno, carla, company } = on
  await on.decide(carla, await on.asked(bruno, 1), { decision: 'DECLINE' })
  // Carla, who decided, leaves: Bruno's line no longer names her.
  const out = await call(hub, ana, 'DELETE', `${company}/members/${carla.id}`)
  assert.equal(out.statusCode, 204, out.body)
  const [declined] = await on.notices(bruno)
  assert.deepEqual(Object(declined).decidedBy, null)
  // Bruno, who asked, leaves: his requests and what they told go with him.
  await on.asked(bruno, 2)
  assert.equal((await on.notices(ana)).length, 2)
  assert.equal((await call(hub, ana, 'DELETE', `${company}/members/${bruno.id}`)).statusCode, 204)
  const counts = `select (select count(*)::int from requests.request) as requests,
    (select count(*)::int from notifications.request_notice) as notices`
  assert.deepEqual(await hub.test.asOwner(counts), [{ requests: 0, notices: 0 }])
  assert.deepEqual(await on.notices(ana), [])
  // The Projeto deleted takes its requests and what they told.
  const fabio = await memberOn(hub, on.companyId, FABIO, 'member')
  await on.asked(fabio, 2)
  assert.deepEqual(await hub.test.asOwner(counts), [{ requests: 1, notices: 1 }])
  const deleted = await call(hub, ana, 'DELETE', on.project, { name: 'Pedidos' })
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.deepEqual(await hub.test.asOwner(counts), [{ requests: 0, notices: 0 }])
})
