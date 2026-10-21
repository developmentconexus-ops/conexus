import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, ConversationEvent, ProjectId } from '@conexus/hub-api'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import {
  conversing,
  hubBeside,
  PARTIAL,
  sent,
  started,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'

const WRITE = 'mastra_workspace_write_file'

/** A reply that says `PARTIAL`, waits to be released, then says `rest`; released at the test's end at the latest. */
function pausing(t: Parameters<typeof conversing>[0], rest: string) {
  const pause = Promise.withResolvers<void>()
  t.after(() => pause.resolve())
  const reply: Reply = { kind: 'hold', until: pause.promise, text: PARTIAL, rest }
  return { reply, release: () => pause.resolve() }
}

async function journalIsOneStory(hub: Awaited<ReturnType<typeof hubBeside>>) {
  const rows = await hub.test.asOwner('select n, event from builder.run_event order by n')
  const events = rows.map((row) => ConversationEvent.parse(row.event))
  const texts = events.flatMap((event) => (event.type === 'text' ? [event.delta] : []))
  assert.equal(texts.join('').includes('resto do primeiro'), false)
  assert.deepEqual(
    rows.map((row) => row.n),
    rows.map((_, index) => index + 1),
  )
}

test('dois processos, um banco; o primeiro morre: o segundo toma a posse, religa, continua no mesmo prazo e guarda uma versão; o primeiro não grava', async (t) => {
  const first = pausing(t, 'resto do primeiro')
  const second = pausing(t, 'resto do segundo')
  let calls = 0
  function answer(call: Sent): Reply {
    const named = title(call)
    if (named !== undefined) return named
    calls += 1
    if (calls === 1) return first.reply
    if (calls === 2) {
      const input = { path: 'a.ts', content: 'x\n' }
      return { kind: 'blocks', blocks: [{ type: 'tool_use', name: WRITE, input }] }
    }
    return second.reply
  }
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, answer)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const before = await hub.test.asOwner('select id, owner, deadline_at from builder.run')
  assert.equal(before.length, 0)
  const alive = await streamOf(hub, ana, url)
  t.after(() => alive.close())
  assert.equal((await sent(hub, ana, url, 'Faça a página')).statusCode, 202)
  assert.deepEqual(await alive.said(), { type: 'text', delta: PARTIAL })
  const [open] = await hub.test.asOwner('select id, owner, deadline_at from builder.run')
  assert.ok(open)

  // The first process dies: its lease ends in the table while its turn hangs.
  await hub.test.asOwner(`update builder.run set lease_until = now() - interval '1 second'`)
  const beside = await hubBeside(t, hub)
  const stream = await streamOf(beside, ana, url)
  t.after(() => stream.close())
  const snapshot = await stream.next()
  assert.ok(snapshot.type === 'turn')
  assert.deepEqual(snapshot.message.parts, [{ type: 'text', text: PARTIAL }])

  await beside.restart()
  const [taken] = await beside.test.asOwner('select id, owner, deadline_at, state from builder.run')
  assert.ok(taken)
  assert.equal(taken.id, open.id)
  assert.notEqual(taken.owner, open.owner)
  assert.deepEqual(taken.deadline_at, open.deadline_at)

  // The second process went on: what it said reaches the stream, an id from elsewhere gets the picture.
  const again = await streamOf(beside, ana, url, `${randomUUID()}.3`)
  t.after(() => again.close())
  assert.ok((await again.next()).type === 'turn')
  const midway = stream.seen.ids.at(-1)
  assert.ok(midway)

  first.release()
  second.release()
  const rest = await stream.turn()
  assert.deepEqual(rest.at(-1), { type: 'turnEnd', reason: 'complete' })
  const reopened = await streamOf(beside, ana, url, midway)
  t.after(() => reopened.close())
  const missed = await reopened.turn()
  assert.deepEqual(reopened.seen.ids, stream.seen.ids.slice(stream.seen.ids.indexOf(midway) + 1))
  assert.deepEqual(missed.at(-1), { type: 'turnEnd', reason: 'complete' })

  await journalIsOneStory(beside)
  assert.equal((await beside.test.asOwner('select state from builder.run'))[0]?.state, 'saved')
  const repository = beside.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
  assert.equal(await repository.version(), 1)
})
