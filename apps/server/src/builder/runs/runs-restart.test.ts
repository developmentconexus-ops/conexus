import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { call } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import {
  asked,
  conversing,
  hubBeside,
  PARTIAL,
  rolesAndParts,
  sent,
  started,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'

const WRITE = 'mastra_workspace_write_file'

function written(): Reply {
  return {
    kind: 'blocks',
    blocks: [{ type: 'tool_use', name: WRITE, input: { path: 'a.ts', content: 'x\n' } }],
  }
}

/** A first process that writes `a.ts` and then hangs; what a second process is asked, in `seen`. */
function dyingTurn(t: Parameters<typeof conversing>[0]) {
  const pause = Promise.withResolvers<void>()
  t.after(() => pause.resolve())
  const seen: string[] = []
  let calls = 0
  function answer(call: Sent): Reply {
    const named = title(call)
    if (named !== undefined) return named
    calls += 1
    seen.push(call.texts.join('\n'))
    if (calls === 1) return written()
    if (calls === 2) return { kind: 'hold', until: pause.promise, text: PARTIAL, rest: 'resto' }
    return { kind: 'text', text: 'Terminei.' }
  }
  return { answer, seen, release: () => pause.resolve() }
}

async function crashed(t: Parameters<typeof conversing>[0], laterDeadline: boolean) {
  const turn = dyingTurn(t)
  const world = await conversing(t, turn.answer)
  const { hub, ana, conversations } = world
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const alive = await streamOf(hub, ana, url)
  t.after(() => alive.close())
  assert.equal((await sent(hub, ana, url, 'Faça a página')).statusCode, 202)
  for (let event = await alive.said(); event.type !== 'text'; event = await alive.said());
  const past = laterDeadline ? '' : `, deadline_at = now() - interval '1 second'`
  await hub.test.asOwner(`update builder.run set lease_until = now() - interval '1 second'${past}`)
  const beside = await hubBeside(t, hub)
  beside.builder.control.outcome = 'connected'
  await beside.restart()
  // Reading the conversation opens the memory the hub's close shuts down.
  const reading = await streamOf(beside, ana, url)
  t.after(() => reading.close())
  return { ...world, beside, turn, url }
}

async function versionOf(world: Awaited<ReturnType<typeof crashed>>) {
  const repository = world.beside.builder.repository({
    companyId: CompanyId.parse(world.companyId),
    projectId: ProjectId.parse(world.projectId),
  })
  return repository.version()
}

async function stateOf(hub: Pick<Awaited<ReturnType<typeof hubBeside>>, 'test'>) {
  return (await hub.test.asOwner('select state from builder.run'))[0]?.state
}

test('reinício depois da hora do turno: o que o primeiro processo escreveu é guardado como estava, não interrupted', async (t) => {
  const world = await crashed(t, false)
  assert.equal(await stateOf(world.beside), 'saved')
  assert.equal(await versionOf(world), 1)
})

test('reinício no meio do turno: o turno retomado é avisado do reinício, e termina sem chamar ferramenta guardando o que a máquina já tinha', async (t) => {
  const world = await crashed(t, true)
  world.turn.release()
  for (let attempt = 0; attempt < 50 && (await stateOf(world.beside)) !== 'saved'; attempt += 1) {
    await new Promise((done) => setTimeout(done, 100))
  }
  assert.equal(await stateOf(world.beside), 'saved')
  assert.equal(await versionOf(world), 1)
  const told = world.turn.seen.join('\n')
  assert.match(
    told,
    /O servidor reiniciou no meio do turno\. Veja `git status` e termine o pedido\./,
  )
  const shown = JSON.stringify(rolesAndParts(await call(world.beside, world.ana, 'GET', world.url)))
  assert.match(
    shown,
    /"type":"machine","phase":"resumed"/,
    'the restart is in the stored transcript',
  )
  assert.match(
    shown,
    /"type":"version","number":1/,
    'the saved version is in the stored transcript',
  )
})

test('guardar leva mais que a posse: a posse segue renovada, outra mensagem não ganha o Projeto e a versão sai uma vez', async (t) => {
  const { hub, ana, conversations, companyId, projectId } = await conversing(t, (call) => {
    const named = title(call)
    if (named !== undefined) return named
    return call.texts.length > 2 ? { kind: 'text', text: 'Pronto.' } : written()
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
  assert.equal(await stateOf(hub), 'saved')
  const repository = hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
  assert.equal(await repository.version(), 1)
})

test('o processo morto deixa a posse a vencer: o outro, ao partir, não acha nada, e acha o turno quando a posse vence', async (t) => {
  const turn = dyingTurn(t)
  const { hub, ana, conversations } = await conversing(t, turn.answer)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const alive = await streamOf(hub, ana, url)
  t.after(() => alive.close())
  assert.equal((await sent(hub, ana, url, 'Faça a página')).statusCode, 202)
  for (let event = await alive.said(); event.type !== 'text'; event = await alive.said());
  await hub.test.asOwner(`update builder.run set lease_until = now() + interval '2 seconds'`)
  const [first] = await hub.test.asOwner('select owner from builder.run')
  const beside = await hubBeside(t, hub)
  beside.builder.knobs.renewMs = 100
  await beside.restart()
  const reading = await streamOf(beside, ana, url)
  t.after(() => reading.close())
  assert.equal((await hub.test.asOwner('select owner from builder.run'))[0]?.owner, first?.owner)
  let owner = first?.owner
  for (let attempt = 0; attempt < 100 && owner === first?.owner; attempt += 1) {
    await new Promise((done) => setTimeout(done, 100))
    owner = (await hub.test.asOwner('select owner from builder.run'))[0]?.owner
  }
  assert.notEqual(owner, first?.owner, 'the turn is taken once its lease ends')
})

test('parar o processo com um turno que não acaba: passada a espera, a posse é entregue e o turno fica livre para outro', async (t) => {
  const turn = dyingTurn(t)
  const { hub, ana, conversations } = await conversing(t, turn.answer)
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
  turn.release()
  await closing
})
