import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import {
  asked,
  conversing,
  holding,
  hubBeside,
  PARTIAL,
  sent,
  started,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'

const WRITE = 'mastra_workspace_write_file'

/** A first process that writes `a.ts` and then hangs, as if it died; released at the test's end. */
async function dying(t: Parameters<typeof conversing>[0]) {
  const pause = Promise.withResolvers<void>()
  t.after(() => pause.resolve())
  let calls = 0
  function answer(call: Sent): Reply {
    const named = title(call)
    if (named !== undefined) return named
    calls += 1
    if (calls > 1) return { kind: 'hold', until: pause.promise, text: PARTIAL, rest: 'resto' }
    const input = { path: 'a.ts', content: 'x\n' }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', name: WRITE, input }] }
  }
  const world = await conversing(t, answer)
  const { hub, ana, conversations } = world
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const alive = await streamOf(hub, ana, url)
  t.after(() => alive.close())
  assert.equal((await sent(hub, ana, url, 'Faça a página')).statusCode, 202)
  for (let event = await alive.said(); event.type !== 'text'; event = await alive.said());
  await hub.test.asOwner(`update builder.run set lease_until = now() - interval '1 second'`)
  const beside = await hubBeside(t, hub)
  beside.builder.control.outcome = 'connected'
  const repository = beside.builder.repository({
    companyId: CompanyId.parse(world.companyId),
    projectId: ProjectId.parse(world.projectId),
  })
  function version() {
    return repository.version()
  }
  async function state() {
    return (await beside.test.asOwner('select state from builder.run'))[0]?.state
  }
  return { ...world, url, alive, beside, version, state, release: () => pause.resolve() }
}

test('dois processos, um banco; o primeiro morre: o segundo, ao partir, guarda o que a máquina tem como uma versão e diz o reinício; o primeiro não grava nem pausa a máquina', async (t) => {
  const { hub, ana, url, alive, beside, version, state, release } = await dying(t)
  const midway = alive.seen.ids.at(-1)
  await beside.restart()
  assert.equal(await state(), 'saved')
  assert.equal(await version(), 1)
  const reopened = await streamOf(beside, ana, url, midway)
  t.after(() => reopened.close())
  assert.deepEqual((await reopened.turn()).slice(-2), [
    { type: 'part', part: { type: 'restarted', kept: 1 } },
    { type: 'turnEnd', reason: 'aborted' },
  ])
  release()
  await hub.close()
  assert.equal(await version(), 1, 'the first process writes nothing')
  const [last] = await beside.test.asOwner(
    'select event from builder.run_event order by n desc limit 1',
  )
  assert.deepEqual(last?.event, { type: 'turnEnd', reason: 'aborted' }, 'nor journals')
  assert.equal(hub.builder.control.stops, 0, 'the first process does not pause the machine')
  const rows = await beside.test.asOwner('select n from builder.run_event order by n')
  assert.deepEqual(
    rows.map((row) => row.n),
    rows.map((_, index) => index + 1),
  )
})

test('a posse do primeiro vence e chega mensagem no Projeto antes da partida do segundo: a admissão guarda o turno órfão, não o marca interrupted, e admite a nova', async (t) => {
  const { ana, conversations, beside, version } = await dying(t)
  const other = `${conversations}/${await started(beside, ana, conversations)}`
  assert.equal((await sent(beside, ana, other, 'Mande de novo')).statusCode, 202)
  const states = await beside.test.asOwner('select state from builder.run order by deadline_at')
  assert.equal(states[0]?.state, 'saved')
  assert.equal(await version(), 1)
})

test('o guardar do turno órfão falha na partida: a partida segue, e a admissão seguinte o assenta', async (t) => {
  const { ana, conversations, beside, version, state } = await dying(t)
  beside.builder.knobs.dies.advance = 1
  await beside.restart()
  assert.equal(await state(), 'saving')
  await beside.test.asOwner(`update builder.run set lease_until = now() - interval '1 second'`)
  const other = `${conversations}/${await started(beside, ana, conversations)}`
  assert.equal((await sent(beside, ana, other, 'Mande de novo')).statusCode, 202)
  assert.equal(await version(), 1)
})

test('uma renovação da posse falha: o prazo do turno perdido não para o próximo turno da conversa', async (t) => {
  const holds = [Promise.withResolvers<void>(), Promise.withResolvers<void>()]
  t.after(() => {
    for (const hold of holds) hold.resolve()
  })
  let calls = 0
  const { hub, ana, conversations } = await conversing(t, (call) => {
    const named = title(call)
    if (named !== undefined) return named
    const hold = holds[Math.min(calls++, 1)]
    return { kind: 'hold', until: hold?.promise ?? Promise.resolve(), text: PARTIAL, rest: 'resto' }
  })
  hub.builder.knobs.renewMs = 50
  hub.builder.knobs.turnMs = 1_500
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const alive = await streamOf(hub, ana, url)
  t.after(() => alive.close())
  assert.equal((await sent(hub, ana, url, 'Primeira')).statusCode, 202)
  for (let event = await alive.said(); event.type !== 'text'; event = await alive.said());
  await hub.test.asOwner('update builder.run set owner = gen_random_uuid()')
  // A lost lease refuses the turn's events, so its end shows only in the log.
  function ended() {
    return hub.lines.some((line) => line.message === 'CONVERSATION_TURN_ENDED')
  }
  for (let attempt = 0; attempt < 50 && !ended(); attempt += 1) {
    await new Promise((done) => setTimeout(done, 50))
  }
  assert.equal(ended(), true)
  await hub.test.asOwner(`update builder.run set state = 'interrupted'`)
  hub.builder.knobs.turnMs = 3_600_000
  assert.equal((await sent(hub, ana, url, 'Segunda')).statusCode, 202)
  for (let event = await alive.said(); event.type !== 'text'; event = await alive.said());
  await new Promise((done) => setTimeout(done, 2_000))
  const open = await hub.test.asOwner(`select state from builder.run where state = 'open'`)
  assert.equal(open.length, 1, "the second turn still runs past the lost turn's hour")
})

test('guardar leva mais que a posse: a posse segue renovada, outra mensagem não ganha o Projeto e a versão sai uma vez', async (t) => {
  const { hub, ana, conversations, companyId, projectId } = await conversing(t, (call) => {
    const named = title(call)
    if (named !== undefined) return named
    if (call.texts.length > 2) return { kind: 'text', text: 'Pronto.' }
    const input = { path: 'a.ts', content: 'x\n' }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', name: WRITE, input }] }
  })
  hub.builder.knobs.renewMs = 50
  const gate = Promise.withResolvers<void>()
  t.after(() => gate.resolve())
  hub.builder.knobs.holdAdvance = gate.promise
  const pending = asked(t, { hub, person: ana, conversations })
  let saving: unknown
  for (let attempt = 0; attempt < 100 && saving !== 'saving'; attempt += 1) {
    saving = (await hub.test.asOwner('select state from builder.run'))[0]?.state
    await new Promise((done) => setTimeout(done, 50))
  }
  assert.equal(saving, 'saving')
  await hub.test.asOwner(`update builder.run set lease_until = now() - interval '1 second'`)
  let renewed = false
  for (let attempt = 0; attempt < 40 && !renewed; attempt += 1) {
    await new Promise((done) => setTimeout(done, 50))
    const [row] = await hub.test.asOwner(`select lease_until > now() as held from builder.run`)
    renewed = row?.held === true
  }
  assert.equal(renewed, true, 'the lease of a run being saved is renewed')
  gate.resolve()
  await pending
  assert.equal((await hub.test.asOwner('select state from builder.run'))[0]?.state, 'saved')
  const repository = hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
  assert.equal(await repository.version(), 1)
})
test('parar o processo com um turno que não acaba: passada a espera, a posse é entregue e o turno fica livre para outro', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (call) => title(call) ?? held.reply)
  hub.builder.knobs.yieldMs = 200
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const alive = await streamOf(hub, ana, url)
  t.after(() => alive.close())
  assert.equal((await sent(hub, ana, url, 'Faça a página')).statusCode, 202)
  for (let event = await alive.said(); event.type !== 'text'; event = await alive.said());
  const closing = hub.close()
  for (let wait = 0; wait < 100; wait += 1) {
    const [row] = await hub.test.asOwner(`select lease_until < now() as free from builder.run`)
    if (row?.free === true) break
    await new Promise((later) => setTimeout(later, 50))
  }
  const [row] = await hub.test.asOwner(`select lease_until < now() as free from builder.run`)
  assert.equal(row?.free, true, 'the lease is given up while the turn still runs')
  held.release()
  await closing
})
