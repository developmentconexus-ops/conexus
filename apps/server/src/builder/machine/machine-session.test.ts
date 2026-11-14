import assert from 'node:assert/strict'
import { renameSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { COMPANY, CONVERSATION, moveMain, PROJECT, pausedByE2b, world } from './test-machine.ts'

test('máquina: a sessão vive com a conversa mas cada turno recomeça: as fases vão ao ouvinte do turno, a máquina que sumiu entre turnos volta nova sem MACHINE_LOST, e o turno que não a usou não guarda nada', async (t) => {
  const { control, machines, base, folder } = await world(t)
  function turn(onPhase: (phase: string) => void) {
    return machines.workspaceFor({
      ...{ companyId: COMPANY, projectId: PROJECT, conversationId: CONVERSATION },
      onPhase,
    })
  }
  const first: string[] = []
  await (await turn((phase) => first.push(phase))).filesystem?.writeFile('a.ts', 'um\n')
  await machines.release(CONVERSATION)
  const second: string[] = []
  const next = await turn((phase) => second.push(phase))
  control.outcome = 'created'
  control.restartBeforeNextCommand = true
  await next.filesystem?.writeFile('b.ts', 'dois\n')
  assert.deepEqual(second, ['copying'], 'the second turn’s listener hears the second turn’s phases')
  assert.deepEqual(first, ['starting', 'copying'], 'and the first one hears nothing more')
  const collected = await machines.collect({ conversationId: CONVERSATION, base })
  assert.ok(
    typeof collected === 'object',
    'a machine that died between turns is no loss of this one',
  )
  await machines.release(CONVERSATION)
  await turn(() => undefined)
  assert.equal(machines.touched(CONVERSATION), false)
  assert.equal(await machines.collect({ conversationId: CONVERSATION, base }), 'unchanged')
  assert.equal(await machines.changed({ conversationId: CONVERSATION }), false)
  assert.ok(folder.length > 0)
})

test('máquina: a volta da pausa no meio do turno traz o main sem tirar o trabalho do turno', async (t) => {
  const { open, control, folder } = await world(t)
  const workspace = await open()
  await workspace.filesystem?.writeFile('a.ts', 'um\n')
  moveMain(join(folder, 'git', COMPANY, `${PROJECT}.git`), 'b.ts', 'outra\n')
  pausedByE2b(control)
  assert.equal(await workspace.filesystem?.readFile('b.ts', { encoding: 'utf-8' }), 'outra\n')
  assert.equal(await workspace.filesystem?.exists('a.ts'), true)
})

test('máquina: o início que falhou não fica recusado para sempre: a ferramenta seguinte tenta de novo, e apagar a conversa tira a sessão', async (t) => {
  const { open, control, machines } = await world(t)
  control.start = 'unreachable'
  const workspace = await open()
  await assert.rejects(workspace.filesystem?.exists('a.ts') ?? Promise.reject(), {
    code: 'MACHINE_UNAVAILABLE',
  })
  control.start = 'ok'
  await workspace.filesystem?.writeFile('a.ts', 'um\n')
  assert.equal(control.names.length, 2, 'the failed start and its retry, nothing else')
  await machines.kill(CONVERSATION)
  const again = await open()
  await again.filesystem?.writeFile('b.ts', 'dois\n')
  assert.equal(
    control.names.length,
    3,
    'a deleted conversation keeps no session: its machine starts again',
  )
})

test('máquina: a releitura das marcas que falha (saída diferente de zero) falha a ferramenta, e a seguinte e o collect passam', async (t) => {
  const { open, machines, base, folder } = await world(t)
  await (await open()).filesystem?.writeFile('a.ts', 'um\n')
  await machines.release(CONVERSATION)
  const git = join(folder, 'app', '.git')
  renameSync(git, `${git}.away`)
  const next = await open()
  await assert.rejects(next.filesystem?.exists('a.ts') ?? Promise.reject(), /markers not read/)
  renameSync(`${git}.away`, git)
  assert.equal(await next.filesystem?.exists('a.ts'), true, 'the next tool reads again and goes on')
  const collected = await machines.collect({ conversationId: CONVERSATION, base })
  assert.ok(typeof collected === 'object', 'and the turn saves what it wrote')
})
