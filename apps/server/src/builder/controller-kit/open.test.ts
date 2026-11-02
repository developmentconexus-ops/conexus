import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { codeOf, post } from '../../hub/identity/test-hub.ts'
import { conversing } from '../conversation/test-conversation.ts'
import { attemptIdOf } from './public.ts'

/**
 * A fixed owner and the three keys an Assistant conversation is found by today, with the id
 * `conversationIdOf` gave each before the kit existed (step 24.3, U1b): the route's attempt, an
 * automation's run and an automation's own id.
 */
const OWNER = {
  companyId: CompanyId.parse('Q2xpZW50ZUV4ZW1wbG9QYXJhVGVzdGUx'),
  personId: PersonId.parse('PessoaDeTesteDoVetorFixo0000001'),
}
const RECORDED = [
  ['8d0e7f0a-2b1c-4e5f-9a6b-7c8d9e0f1a2b', '1192f231-4e24-8862-a649-3a22d7f5555c'],
  [
    'sched_schedule_conexus-automation-0f7e5c3a-1b2d-8c4e-9a6f-5d3b2a1c0e9f_1767268800000',
    'b019e786-36c1-8865-bdaf-d56af2daeef4',
  ],
  ['automation:3c9e1a7b-5d2f-4a8c-b6e0-1f2d3c4b5a69', '887588e5-7eeb-8b0c-bf67-c9a284c1c51e'],
] as const

test('o id do Assistente: a rota, a execução e a automação dão o id de antes, byte a byte', () => {
  for (const [key, id] of RECORDED) assert.equal(attemptIdOf('assistant', OWNER, key), id, key)
})

/** The thread rows Mastra holds, by id. */
async function threadsOf(hub: Awaited<ReturnType<typeof conversing>>['hub']) {
  const { rows } = await hub.test.mastraPool.query('select id from mastra.mastra_threads')
  return rows.map((row) => String(Object(row).id)).sort()
}

test('a mesma chave duas vezes ao mesmo tempo: uma conversa e um fio; outro corpo: IDEMPOTENCY_CONFLICT', async (t) => {
  const { hub, ana, conversations } = await conversing(t, () => ({ kind: 'text', text: 'ok' }))
  const key = randomUUID()
  const both = await Promise.all([
    post(hub, ana, conversations, {}, key),
    post(hub, ana, conversations, {}, key),
  ])
  assert.deepEqual(
    both.map((each) => each.statusCode),
    [201, 201],
  )
  const [id, other] = both.map((each) => String(Object(each.json()).conversation.id))
  assert.equal(other, id)
  assert.deepEqual(await threadsOf(hub), [id])
  const rows = await hub.test.asOwner('select id::text from builder.conversation')
  assert.deepEqual(rows, [{ id }])
  const conflict = await post(hub, ana, conversations, { effort: 'high' }, key)
  assert.deepEqual([conflict.statusCode, codeOf(conflict)], [409, 'IDEMPOTENCY_CONFLICT'])
})

test('a tentativa antiga: a chave de uma linha de antes do kit, uma vez e duas ao mesmo tempo, devolve o id dessa linha e deixa um fio só', async (t) => {
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, () => ({
    kind: 'text',
    text: 'ok',
  }))
  // A row as the Builder wrote it before the kit, with a random id, whose thread a cut never made.
  const made = await post(hub, ana, conversations, {}, randomUUID())
  const [row] = await hub.test.asOwner(
    'select body_hash as hash from builder.conversation where id = $1',
    [Object(made.json()).conversation.id],
  )
  const hash = String(row?.hash)
  async function earlier(key: string): Promise<string> {
    const id = randomUUID()
    await hub.test.asOwner(
      `insert into builder.conversation
         (id, company_id, project_id, person_id, attempt_key, body_hash, created_at)
       values ($1, $2, $3, $4, $5, $6, now())`,
      [id, companyId, projectId, ana.id, key, hash],
    )
    return id
  }
  const before = await threadsOf(hub)

  const once = randomUUID()
  const onceId = await earlier(once)
  const answered = await post(hub, ana, conversations, {}, once)
  assert.equal(answered.statusCode, 201)
  assert.equal(Object(answered.json()).conversation.id, onceId)
  const again = await post(hub, ana, conversations, {}, once)
  assert.equal(Object(again.json()).conversation.id, onceId)

  const twice = randomUUID()
  const twiceId = await earlier(twice)
  const both = await Promise.all([
    post(hub, ana, conversations, {}, twice),
    post(hub, ana, conversations, {}, twice),
  ])
  assert.deepEqual(
    both.map((each) => [each.statusCode, Object(each.json()).conversation.id]),
    [
      [201, twiceId],
      [201, twiceId],
    ],
  )
  assert.deepEqual(await threadsOf(hub), [...before, onceId, twiceId].sort())
  const conflict = await post(hub, ana, conversations, { effort: 'high' }, once)
  assert.deepEqual([conflict.statusCode, codeOf(conflict)], [409, 'IDEMPOTENCY_CONFLICT'])
})
