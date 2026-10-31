import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { RunId } from '@conexus/hub-api'
import { COMPANY, CONVERSATION, INSTALLATION, moveMain, PROJECT, world } from './test-machine.ts'

// A machine found again after another conversation of the Projeto moved `main`: its folder keeps the
// cut turn's work merged onto `main`, and the model is told what did not merge.
test('máquina: o turno cortado enquanto outra conversa moveu o main: religada, a pasta guarda o trabalho cortado sobre o main', async (t) => {
  const { open, machines, control, repository, folder } = await world(t)
  await (await open()).filesystem?.writeFile('cut.ts', 'meio\n')
  moveMain(join(folder, 'git', COMPANY, `${PROJECT}.git`), 'b.ts', 'outra\n')
  control.outcome = 'connected'
  const after = await open()
  assert.equal(await after.filesystem?.readFile('cut.ts', { encoding: 'utf-8' }), 'meio\n')
  assert.equal(await after.filesystem?.readFile('b.ts', { encoding: 'utf-8' }), 'outra\n')
  assert.doesNotMatch(await after.getInstructionsAsync(), /conflict/)
  const main = await repository.ensure()
  const bundle = await machines.collect({ conversationId: CONVERSATION, base: main })
  assert.ok(typeof bundle === 'object', 'collected on the new main, the cut work is what changed')
  assert.equal(bundle.changedFiles, 1)
})

test('máquina: o turno cortado e outra conversa mudaram a mesma linha: as marcas do conflito ficam no arquivo e o modelo é avisado dos caminhos', async (t) => {
  const { open, control, folder } = await world(t)
  await (await open()).filesystem?.writeFile('s.ts', 'meio\n')
  moveMain(join(folder, 'git', COMPANY, `${PROJECT}.git`), 's.ts', 'outra\n')
  control.outcome = 'connected'
  const after = await open()
  const text = String(await after.filesystem?.readFile('s.ts', { encoding: 'utf-8' }))
  assert.match(text, /^<<<<<<< [^\n]*\noutra\n=======\nmeio\n>>>>>>> /)
  assert.match(
    await after.getInstructionsAsync(),
    /conflict markers; resolve them before any other change: `s\.ts`\./,
  )
})

test('máquina: as marcas que um turno salvou são avisadas no turno seguinte, e o arquivo que o Builder resolveu sai do aviso', async (t) => {
  const { open, machines, repository, control, folder } = await world(t)
  await (await open()).filesystem?.writeFile('s.ts', 'meio\n')
  moveMain(join(folder, 'git', COMPANY, `${PROJECT}.git`), 's.ts', 'outra\n')
  control.outcome = 'connected'
  let run = 10
  async function save() {
    const base = await repository.ensure()
    const bundle = await machines.collect({ conversationId: CONVERSATION, base })
    assert.ok(typeof bundle === 'object', `the turn is saved, not ${String(bundle)}`)
    const runId = RunId.parse(`00000000-0000-4000-8000-0000000000${run++}`)
    const received = await repository.receive({ runId, bundle: bundle.bundle, base })
    assert.ok(received.ok)
    assert.equal(await repository.advance({ candidate: received.value, base }), 'advanced')
    await machines.release(CONVERSATION)
  }
  // The turn that got the notice saves the markers as they are.
  const noticed = await open()
  assert.equal(await noticed.filesystem?.exists('s.ts'), true)
  await save()
  const next = await open()
  assert.match(String(await next.filesystem?.readFile('s.ts', { encoding: 'utf-8' })), /^<<<<<<< /)
  assert.match(await next.getInstructionsAsync(), /resolve them before any other change: `s\.ts`\./)
  await next.filesystem?.writeFile('s.ts', 'outra\nmeio\n')
  await save()
  const resolved = await open()
  assert.equal(await resolved.filesystem?.readFile('s.ts', { encoding: 'utf-8' }), 'outra\nmeio\n')
  assert.doesNotMatch(await resolved.getInstructionsAsync(), /conflict/)
})

test('máquina: o turno cortado mudou um arquivo que o main novo apagou: a cópia do turno fica e o modelo é avisado de que o main a apagou', async (t) => {
  const { open, control, folder } = await world(t)
  const gitDir = join(folder, 'git', COMPANY, `${PROJECT}.git`)
  moveMain(gitDir, 'd.ts', 'um\n')
  await (await open()).filesystem?.writeFile('d.ts', 'meio\n')
  moveMain(gitDir, 'd.ts', null)
  control.outcome = 'connected'
  const after = await open()
  assert.equal(await after.filesystem?.readFile('d.ts', { encoding: 'utf-8' }), 'meio\n')
  const told = await after.getInstructionsAsync()
  assert.match(told, /deleted in the newer version[^.]*: `d\.ts`\./)
  assert.doesNotMatch(told, /conflict markers/)
})

test('máquina: a religada cujo main não se integra falha com a causa nomeada e deixa a pasta como estava, sem semente', async (t) => {
  let broken = false
  const here = await world(t, 5_000, INSTALLATION, async () =>
    broken ? Buffer.from('not a bundle') : here.repository.bundleOfMain(),
  )
  await (await here.open()).filesystem?.writeFile('a.ts', 'um\n')
  broken = true
  here.control.outcome = 'connected'
  await assert.rejects((await here.open()).filesystem?.exists('a.ts') ?? Promise.reject(), {
    code: 'MACHINE_UNAVAILABLE',
  })
  assert.deepEqual(here.errors, ['MACHINE_SYNC_FAILED', 'MACHINE_UNAVAILABLE'])
  assert.equal(readFileSync(join(here.folder, 'app', 'a.ts'), 'utf-8'), 'um\n')
})
