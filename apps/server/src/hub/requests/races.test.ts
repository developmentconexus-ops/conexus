import assert from 'node:assert/strict'
import { test } from 'node:test'
import { queued, withOwnerLock } from '../../platform/test-database.ts'
import { call, memberOn } from '../identity/test-hub.ts'
import type { Pedidos } from './test-requests.ts'
import { pedidos, refusal } from './test-requests.ts'

const app = 'select 1 from apps.app where project_id = $1 for update'

test('duas decisões', async (t) => {
  const on = await pedidos(t, 2)
  const { hub, ana, bruno, carla, projectId } = on
  const two = await on.asked(bruno, 2)
  const answers = await withOwnerLock(hub.test, app, [projectId], async (release) => {
    const first = on.decide(ana, two, { decision: 'APPROVE' })
    await queued(hub.test, 1)
    const second = on.decide(carla, two, { decision: 'DECLINE' })
    await queued(hub.test, 2)
    await release()
    return Promise.all([first, second])
  })
  assert.deepEqual(answers.map(refusal), [
    [200, undefined],
    [409, 'PUBLISH_REQUEST_CLOSED'],
  ])
  assert.equal(await on.published(), 2)
})

test('decidir e publicar ao mesmo tempo, a decisão primeiro', async (t) => {
  // The approval queues first: it publishes 3, and the publish then puts 1 over it.
  const on = await pedidos(t, 3)
  const { hub, ana, bruno, diego, projectId } = on
  const three = await on.asked(bruno, 3)
  const answers = await withOwnerLock(hub.test, app, [projectId], async (release) => {
    const decision = on.decide(ana, three, { decision: 'APPROVE' })
    await queued(hub.test, 1)
    const publish = on.publish(diego, 1)
    await queued(hub.test, 2)
    await release()
    return Promise.all([decision, publish])
  })
  assert.deepEqual(
    answers.map((answer) => answer.statusCode),
    [200, 200],
  )
  assert.equal(await on.published(), 1)
})

test('decidir e publicar ao mesmo tempo, a publicação primeiro', async (t) => {
  // The publish queues first: it closes the request, and the decision finds it closed.
  const on = await pedidos(t, 3)
  const { hub, ana, bruno, diego, projectId } = on
  const three = await on.asked(bruno, 3)
  const answers = await withOwnerLock(hub.test, app, [projectId], async (release) => {
    const publish = on.publish(diego, 2)
    await queued(hub.test, 1)
    const decision = on.decide(ana, three, { decision: 'APPROVE' })
    await queued(hub.test, 2)
    await release()
    return Promise.all([publish, decision])
  })
  assert.deepEqual(answers.map(refusal), [
    [200, undefined],
    [409, 'PUBLISH_REQUEST_CLOSED'],
  ])
  assert.equal(await on.published(), 2)
  assert.deepEqual(await on.requests(), [
    { number: 3, state: 'SUPERSEDED', reason: null, decided_by: 'Diego Reis' },
  ])
})

test('cancelar e decidir ao mesmo tempo', async (t) => {
  const on = await pedidos(t, 1)
  const { hub, ana, bruno } = on
  // The cancel holds the request first; the approval then finds it closed and publishes nothing.
  const one = await on.asked(bruno, 1)
  const held = 'select 1 from requests.request where id = $1 for update'
  const [cancel, decision] = await withOwnerLock(hub.test, held, [one], async (release) => {
    const cancelling = on.cancel(bruno, one)
    await queued(hub.test, 1)
    const deciding = on.decide(ana, one, { decision: 'APPROVE' })
    await queued(hub.test, 2)
    await release()
    return Promise.all([cancelling, deciding])
  })
  assert.equal(cancel?.statusCode, 204)
  assert.deepEqual(decision && refusal(decision), [409, 'PUBLISH_REQUEST_CLOSED'])
  assert.equal(await on.published(), null)
  assert.deepEqual(await on.requests(), [
    { number: 1, state: 'CANCELLED', reason: null, decided_by: null },
  ])
})

const leaving = [
  ['recusar', null, (on: Pedidos, id: string) => on.decide(on.carla, id, { decision: 'DECLINE' })],
  ['publicar outra versão', 2, (on: Pedidos) => on.publish(on.diego, 2)],
  ['aprovar', 1, (on: Pedidos, id: string) => on.decide(on.carla, id, { decision: 'APPROVE' })],
] as const

for (const [name, published, deciding] of leaving) {
  test(`${name} enquanto quem pediu sai da empresa`, async (t) => {
    const on = await pedidos(t, 2)
    const { hub, ana, company } = on
    const held = 'select 1 from requests.request where id = $1 for update'
    const asker = await memberOn(
      hub,
      on.companyId,
      { name: 'Gil Souza', email: 'quem-sai@example.test' },
      'member',
    )
    const one = await on.asked(asker, 1)
    // The decision holds the asker before the request, so the removal waits for it to commit.
    const answers = await withOwnerLock(hub.test, held, [one], async (release) => {
      const decision = deciding(on, one)
      await queued(hub.test, 1)
      const removal = call(hub, ana, 'DELETE', `${company}/members/${asker.id}`)
      await queued(hub.test, 2)
      await release()
      return Promise.all([decision, removal])
    })
    assert.deepEqual(
      answers.map((answer) => answer.statusCode),
      [200, 204],
    )
    assert.deepEqual(await on.requests(), [])
    assert.equal(await on.published(), published)
  })
}
