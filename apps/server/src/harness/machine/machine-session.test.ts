import assert from 'node:assert/strict'
import { renameSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  COMPANY,
  CONVERSATION,
  moveMain,
  PROJECT,
  pausedByE2b,
  sandboxOf,
  world,
} from './test-machine.ts'
import { fileTools } from './test-machine-files.ts'

test('máquina: a sessão vive com a conversa mas cada turno recomeça: as fases vão ao ouvinte do turno, a máquina que sumiu entre turnos volta nova sem MACHINE_LOST, e o turno que não a usou não guarda nada', async (t) => {
  const { control, machines, folder } = await world(t)
  function turn(onPhase: (phase: string) => void) {
    return machines.workspaceFor({
      ...{ companyId: COMPANY, projectId: PROJECT, conversationId: CONVERSATION },
      onPhase,
    })
  }
  const first: string[] = []
  await fileTools(await turn((phase) => first.push(phase))).writeFile('a.ts', 'um\n')
  await machines.release(CONVERSATION)
  const second: string[] = []
  const next = await turn((phase) => second.push(phase))
  control.outcome = 'created'
  control.restartBeforeNextCommand = true
  await fileTools(next).writeFile('b.ts', 'dois\n')
  assert.deepEqual(second, ['copying'], 'the second turn’s listener hears the second turn’s phases')
  assert.deepEqual(first, ['starting', 'copying'], 'and the first one hears nothing more')
  const collected = await machines.collect({ conversationId: CONVERSATION })
  assert.ok(
    typeof collected === 'object',
    'a machine that died between turns is no loss of this one',
  )
  await machines.release(CONVERSATION)
  await turn(() => undefined)
  assert.equal(machines.touched(CONVERSATION), false)
  assert.equal(await machines.collect({ conversationId: CONVERSATION }), 'unchanged')
  assert.equal(await machines.changed({ conversationId: CONVERSATION }), false)
  assert.ok(folder.length > 0)
})

test('máquina: a volta da pausa no meio do turno traz o main sem tirar o trabalho do turno', async (t) => {
  const { open, control, folder } = await world(t)
  const workspace = await open()
  await fileTools(workspace).writeFile('a.ts', 'um\n')
  moveMain(join(folder, 'git', COMPANY, `${PROJECT}.git`), 'b.ts', 'outra\n')
  pausedByE2b(control)
  const resumed = await (await sandboxOf(workspace)).executeCommand('sh', [
    '-c',
    'cat b.ts && test -e a.ts && echo ok',
  ])
  assert.equal(resumed.stdout, 'outra\nok\n')
})

test('máquina: o início que falhou não fica recusado para sempre: a ferramenta seguinte tenta de novo, e apagar a conversa tira a sessão', async (t) => {
  const { open, control, machines } = await world(t)
  control.start = 'unreachable'
  const workspace = await open()
  await assert.rejects(fileTools(workspace).exists('a.ts'), {
    code: 'MACHINE_UNAVAILABLE',
  })
  control.start = 'ok'
  await fileTools(workspace).writeFile('a.ts', 'um\n')
  assert.equal(control.names.length, 2, 'the failed start and its retry, nothing else')
  await machines.kill(CONVERSATION)
  const again = await open()
  await fileTools(again).writeFile('b.ts', 'dois\n')
  assert.equal(
    control.names.length,
    3,
    'a deleted conversation keeps no session: its machine starts again',
  )
})

test('máquina: a releitura das marcas que falha (saída diferente de zero) falha a ferramenta, e a seguinte e o collect passam', async (t) => {
  const { open, machines, folder } = await world(t)
  await fileTools(await open()).writeFile('a.ts', 'um\n')
  await machines.release(CONVERSATION)
  const git = join(folder, 'app', '.git')
  renameSync(git, `${git}.away`)
  const next = await open()
  await assert.rejects(fileTools(next).exists('a.ts'), /markers not read/)
  renameSync(`${git}.away`, git)
  assert.equal(await fileTools(next).exists('a.ts'), true, 'the next tool reads again and goes on')
  const collected = await machines.collect({ conversationId: CONVERSATION })
  assert.ok(typeof collected === 'object', 'and the turn saves what it wrote')
})

test('máquina: as marcas são relidas uma vez por turno, na primeira ferramenta de uma máquina já ligada, e não de novo nem depois de uma partida', async (t) => {
  const { open, machines, folder } = await world(t)
  const marked = String.raw`printf '<<<<<<< a\nx\n=======\ny\n>>>>>>> b\n'`
  async function turnTold(write: string) {
    const workspace = await open()
    await fileTools(workspace).exists('a.ts')
    await (await sandboxOf(workspace)).executeCommand('sh', [
      '-c',
      `cd ${join(folder, 'app')} && ${marked} > ${write} && git add -A`,
    ])
    await fileTools(workspace).exists('a.ts')
    return workspace.getInstructionsAsync()
  }
  assert.doesNotMatch(await turnTold('first.ts'), /first\.ts/)
  await machines.release(CONVERSATION)
  const told = await turnTold('second.ts')
  assert.match(told, /first\.ts/)
  assert.doesNotMatch(told, /second\.ts/)
})

test('máquina: o Computador do Construtor de apps não traz regra de aprovação própria: quem decide é a ficha', async (t) => {
  const { open } = await world(t)
  assert.equal((await open()).getToolsConfig()?.requireApproval, undefined)
})
