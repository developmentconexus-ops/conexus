import assert from 'node:assert/strict'
import { test } from 'node:test'
import { connectorOf } from '../index.ts'
import { runConformance } from '../kernel/conformance.ts'
import { answerOf, signIn } from '../kernel/conformance-session.ts'
import { requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { Rows } from '../kernel/rows.ts'
import { hubspot } from './definition.ts'
import { hubspotFake } from './fake.ts'
import { contatos } from './operations/contatos.ts'

runConformance(hubspot, hubspotFake())

test('o HubSpot é achado pelo id', () => {
  assert.equal(connectorOf('hubspot'), hubspot)
  assert.equal(connectorOf('HubSpot'), undefined)
})

test('a lista de contatos anda cada página uma vez pelo after', async () => {
  const fake = hubspotFake()
  const session = await signIn(hubspot, fake)
  assert.ok(session)
  const ids: unknown[] = []
  const asked: (string | null)[] = []
  let after: string | undefined
  for (let pages = 0; pages < 10; pages++) {
    const request = requestOf(contatos, { limit: 100, after }, session.account, new Date())
    asked.push(request.query.after ?? null)
    const sent = toRequest(hubspot, request, session.accessToken)
    const answered = contatos.answer(await answerOf(await fake.handle(sent), hubspot.numbers))
    assert.equal(answered.kind, 'OK')
    if (answered.kind !== 'OK') return
    const page = Rows.parse(answered.value)
    ids.push(...page.linhas.map((row) => row.id))
    if (page.seguinte === undefined) break
    after = page.seguinte
  }
  assert.deepEqual(asked, [null, '100', '200'])
  assert.equal(ids.length, 230)
  assert.equal(new Set(ids).size, 230)
})

test('a conta é o portal', async () => {
  const session = await signIn(hubspot, hubspotFake())
  assert.ok(session)
  assert.equal(session.account.ref, '987654321')
  assert.equal(hubspot.account.kind, 'reported')
  if (hubspot.account.kind !== 'reported') return
  assert.deepEqual(
    hubspot.account.who.answer.parse({ portalId: 987654321, accountType: 'STANDARD' }),
    {
      ref: '987654321',
      label: 'Portal 987654321',
    },
  )
})
