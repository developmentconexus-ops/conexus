import assert from 'node:assert/strict'
import { chmodSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { RunId } from '@conexus/hub-api'
import {
  COMPANY,
  CONVERSATION,
  INSTALLATION,
  moveMain,
  PROJECT,
  sandboxOf,
  world,
} from './test-machine.ts'

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
  const told = await after.getInstructionsAsync()
  assert.match(told, /conflict markers; resolve them before any other change: `s\.ts`\./)
  assert.doesNotMatch(told, /could not merge/)
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
  assert.doesNotMatch(await noticed.getInstructionsAsync(), /could not merge/)
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

test('máquina: o turno cortado e outra conversa mudaram o mesmo arquivo binário: a cópia do main fica e o modelo é avisado de refazer a mudança', async (t) => {
  const { open, control, folder } = await world(t)
  const gitDir = join(folder, 'git', COMPANY, `${PROJECT}.git`)
  moveMain(gitDir, 'img.bin', 'um\0\n')
  await (await open()).filesystem?.writeFile('img.bin', 'meio\0\n')
  moveMain(gitDir, 'img.bin', 'outra\0\n')
  control.outcome = 'connected'
  const after = await open()
  assert.equal(await after.filesystem?.readFile('img.bin', { encoding: 'utf-8' }), 'outra\0\n')
  const told = await after.getInstructionsAsync()
  assert.match(told, /could not merge: redo the change where the app needs it: `img\.bin`\./)
  assert.doesNotMatch(told, /conflict markers/)
})

test('máquina: uma máquina nova sobre um main que guarda marcas de conflito: o modelo é avisado dos caminhos', async (t) => {
  const { open, folder } = await world(t)
  moveMain(
    join(folder, 'git', COMPANY, `${PROJECT}.git`),
    's.ts',
    '<<<<<<< main\noutra\n=======\nmeio\n>>>>>>> cut\n',
  )
  const created = await open()
  assert.equal(await created.filesystem?.exists('s.ts'), true)
  assert.match(
    await created.getInstructionsAsync(),
    /conflict markers; resolve them before any other change: `s\.ts`\./,
  )
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

test('máquina: o trabalho cortado que o turno seguinte juntou ao main continua na pasta quando esse turno termina sem salvar', async (t) => {
  const { open, machines, control, folder } = await world(t)
  await (await open()).filesystem?.writeFile('cut.ts', 'meio\n')
  moveMain(join(folder, 'git', COMPANY, `${PROJECT}.git`), 'b.ts', 'outra\n')
  control.outcome = 'connected'
  const next = await open()
  assert.equal(await next.filesystem?.exists('cut.ts'), true, 'the sync kept the cut work')
  await machines.release(CONVERSATION)
  const third = await open()
  assert.equal(await third.filesystem?.exists('cut.ts'), true, 'an unsaved turn does not drop it')
  assert.equal(await third.filesystem?.exists('b.ts'), true)
})

test('máquina: o trabalho não guardado que o Hub recusaria por tamanho ou por quantidade de arquivos é dito ao modelo, que o enxuga antes de qualquer outra mudança', async (t) => {
  const { open, machines, control, folder } = await world(t)
  const first = await sandboxOf(await open())
  const made = await first.executeCommand('sh', [
    '-c',
    `cd ${join(folder, 'app')} && mkdir many && cd many && seq 1 2100 | xargs touch && cd .. && head -c 70000000 /dev/urandom > big.bin`,
  ])
  assert.equal(made.exitCode, 0, made.stderr)
  await machines.release(CONVERSATION)
  control.outcome = 'connected'
  const next = await open()
  assert.equal(await next.filesystem?.exists('big.bin'), true)
  const told = await next.getInstructionsAsync()
  assert.match(told, /too many files to save[^.]*remove what the app does not need/)
  assert.match(told, /too large to save[^.]*remove what the app does not need/)
})

test('máquina: o trabalho não guardado que cabe no que o Hub aceita não leva aviso de tamanho', async (t) => {
  const { open, machines, control } = await world(t)
  await (await open()).filesystem?.writeFile('cut.ts', 'meio\n')
  await machines.release(CONVERSATION)
  control.outcome = 'connected'
  const next = await open()
  assert.equal(await next.filesystem?.exists('cut.ts'), true)
  assert.doesNotMatch(await next.getInstructionsAsync(), /too large|too many files/)
})

test('máquina: um comando da máquina que não termina no prazo falha a religada com a causa nomeada, em vez de segurar a conversa até o fim da máquina', async (t) => {
  const here = await world(t, 5_000, INSTALLATION, undefined, { commandMs: 400 })
  await (await here.open()).filesystem?.writeFile('a.ts', 'um\n')
  const hook = join(here.folder, 'app', '.git', 'hooks', 'post-checkout')
  writeFileSync(hook, '#!/bin/sh\nsleep 20\n')
  chmodSync(hook, 0o755)
  here.control.outcome = 'connected'
  const started = Date.now()
  await assert.rejects((await here.open()).filesystem?.exists('a.ts') ?? Promise.reject(), {
    code: 'MACHINE_UNAVAILABLE',
  })
  assert.ok(Date.now() - started < 4_000, 'the sync gave up at its own budget')
  assert.deepEqual(here.errors, ['MACHINE_SYNC_FAILED', 'MACHINE_UNAVAILABLE'])
})

test('máquina: um index.lock que um git morto deixou na pasta não prende a conversa: a religada o tira e junta o trabalho não guardado', async (t) => {
  const { open, control, folder } = await world(t)
  await (await open()).filesystem?.writeFile('cut.ts', 'meio\n')
  writeFileSync(join(folder, 'app', '.git', 'index.lock'), '')
  moveMain(join(folder, 'git', COMPANY, `${PROJECT}.git`), 'b.ts', 'outra\n')
  control.outcome = 'connected'
  const after = await open()
  assert.equal(await after.filesystem?.exists('cut.ts'), true)
  assert.equal(await after.filesystem?.exists('b.ts'), true)
})

test('máquina: o lock do índice próprio da junção, que um git morto deixou, não prende a conversa: a religada o tira e junta o trabalho não guardado', async (t) => {
  const { open, control, folder } = await world(t)
  await (await open()).filesystem?.writeFile('cut.ts', 'meio\n')
  writeFileSync(join(folder, 'app', '.git', 'conexus-sync-index.lock'), '')
  moveMain(join(folder, 'git', COMPANY, `${PROJECT}.git`), 'b.ts', 'outra\n')
  control.outcome = 'connected'
  const after = await open()
  assert.equal(await after.filesystem?.exists('cut.ts'), true)
  assert.equal(await after.filesystem?.exists('b.ts'), true)
})

test('máquina: o lock do índice de um guardar que o prazo cortou não impede o guardar seguinte', async (t) => {
  const { open, machines, repository, folder } = await world(t)
  await (await open()).filesystem?.writeFile('cut.ts', 'meio\n')
  writeFileSync(join(folder, 'app', '.git', 'conexus-index.lock'), '')
  const bundle = await machines.collect({
    conversationId: CONVERSATION,
    base: await repository.ensure(),
  })
  assert.ok(typeof bundle === 'object', `the turn is collected, not ${String(bundle)}`)
  assert.equal(bundle.changedFiles, 1)
})

test('máquina: um arquivo com uma linha que só começa como marca de conflito não é conflito: o modelo não é mandado resolvê-lo', async (t) => {
  const { open, folder } = await world(t)
  moveMain(
    join(folder, 'git', COMPANY, `${PROJECT}.git`),
    'doc.md',
    '<<<<<<< é só o exemplo de uma marca\ntexto\n',
  )
  const created = await open()
  assert.equal(await created.filesystem?.exists('doc.md'), true)
  assert.doesNotMatch(await created.getInstructionsAsync(), /conflict/)
})
