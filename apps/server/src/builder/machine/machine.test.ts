import assert from 'node:assert/strict'
import { join } from 'node:path'
import { test } from 'node:test'
import { RunId } from '@conexus/hub-api'
import { createWorkspaceTools, WORKSPACE_TOOLS } from '@mastra/core/workspace'
import {
  COMPANY,
  INSTALLATION,
  OTHER_INSTALLATION,
  PROJECT,
  restoreRefused,
  world,
} from './test-machine.ts'

test('máquina: o primeiro uso liga, copia o main, grava o id; religar volta ao main; sumida é refeita com o aviso, sem criar outra', async (t) => {
  const { open, phases, control, asOwner, machines, base } = await world(t)
  const first = await open()
  assert.deepEqual(phases, [])
  await first.filesystem?.writeFile('a.ts', 'um\n')
  assert.deepEqual(phases, ['starting', 'copying'])
  assert.deepEqual(await asOwner(`select sandbox_id from builder.machine`), [
    { sandbox_id: 'local-machine' },
  ])
  phases.length = 0
  control.outcome = 'connected'
  const woken = await open()
  assert.equal(await woken.filesystem?.exists('a.ts'), false, 'a fresh turn starts from main')
  assert.deepEqual(phases, ['waking', 'copying'])
  assert.equal(control.networkClosed, 1)
  phases.length = 0
  control.outcome = 'created'
  control.exists = false
  const rebuilt = await open()
  await rebuilt.filesystem?.exists('a.ts')
  assert.deepEqual(phases, ['waking', 'replaced', 'copying'])
  assert.equal(control.reattached.at(-1), undefined, 'a gone machine is not asked for by id')
  assert.equal(await rebuilt.filesystem?.exists('a.ts'), false)
  const bundle = await machines.collect({ projectId: PROJECT, base })
  assert.equal(bundle, 'unchanged')
})

test('máquina: um turno retomado guarda os arquivos que a máquina tem; o outro volta ao main, e um commit em outro ramo não apaga a versão anterior', async (t) => {
  const { open, machines, repository, base, control, folder } = await world(t)
  const first = await open()
  const git = `git -c user.name=B -c user.email=b@x.test`
  await first.filesystem?.writeFile('a.ts', 'um\n')
  const committed = await first.sandbox?.executeCommand?.('sh', [
    '-c',
    `cd ${join(folder, 'app')} && git checkout -qb outro && git add -A && ${git} commit -qm um`,
  ])
  assert.equal(committed?.exitCode, 0, committed?.stderr)
  const bundle = await machines.collect({ projectId: PROJECT, base })
  assert.ok(typeof bundle === 'object')
  assert.deepEqual([bundle.files, bundle.changedFiles], [1, 1])
  const received = await repository.receive({
    runId: RunId.parse('00000000-0000-4000-8000-000000000002'),
    bundle: bundle.bundle,
    base,
  })
  assert.ok(received.ok)
  assert.equal(await repository.advance({ candidate: received.value, base }), 'advanced')
  await machines.release(PROJECT)
  control.outcome = 'connected'
  const resumed = await machines.workspaceFor({
    companyId: COMPANY,
    projectId: PROJECT,
    deadline: new Date(Date.now() + 3_600_000),
    resumed: true,
    onPhase: () => undefined,
  })
  assert.equal(machines.touched(PROJECT), true)
  assert.equal(await resumed.filesystem?.exists('a.ts'), true, 'a resumed turn keeps its files')
  await machines.release(PROJECT)
  const next = await open()
  assert.equal(
    await next.filesystem?.exists('a.ts'),
    true,
    'the next turn starts from main, which holds a.ts',
  )
  const second = await machines.collect({ projectId: PROJECT, base: received.value })
  assert.equal(second, 'unchanged')
})

test('máquina: a máquina que cai no meio do turno é refeita, e o turno não guarda o que se perdeu', async (t) => {
  const { open, machines, base, control } = await world(t)
  const workspace = await open()
  await workspace.filesystem?.writeFile('a.ts', 'um\n')
  control.outcome = 'created'
  await control.restart()
  await assert.rejects(machines.collect({ projectId: PROJECT, base }), /died/)
})

test('máquina: a máquina que pausou na hora do turno, ou que o Mastra religa no meio dele, guarda o que o turno escreveu', async (t) => {
  const { open, machines, base, control } = await world(t)
  const workspace = await open()
  await workspace.filesystem?.writeFile('a.ts', 'um\n')
  control.outcome = 'connected'
  await control.restart()
  assert.equal(await workspace.filesystem?.exists('a.ts'), true, 'a reconnect is not a new turn')
  const bundle = await machines.collect({ projectId: PROJECT, base })
  assert.ok(typeof bundle === 'object', `the turn's work is saved, not ${String(bundle)}`)
  assert.deepEqual([bundle.files, bundle.changedFiles], [1, 1])
})

test('máquina: duas ferramentas do Workspace no primeiro passo esperam a semente, pois o running vem antes do onStart', async (t) => {
  const { open, folder, control } = await world(t)
  control.upMs = 300
  const workspace = await open()
  const tools = await createWorkspaceTools(workspace)
  const command = tools[WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]
  assert.ok(command, 'the workspace offers execute_command')
  const head = { command: `cat ${join(folder, 'app')}/.git/HEAD` }
  const first = command.execute(head, { workspace })
  // The second arrives while the machine already says `running` and the seed is still coming.
  while (workspace.sandbox?.status !== 'running') await new Promise((later) => setTimeout(later, 5))
  const seen = [await first, await command.execute(head, { workspace })]
  for (const each of seen) assert.match(JSON.stringify(each), /ref: refs\/heads\/main/)
})

test('máquina: E2B calado passa do prazo externo e um 502 também, ambos MACHINE_UNAVAILABLE, sem gravar id', async (t) => {
  const { open, control, asOwner } = await world(t, 100)
  for (const start of ['hang', 'unreachable', 'gone'] as const) {
    control.start = start
    const workspace = await open()
    await assert.rejects(
      workspace.filesystem?.exists('a.ts') ?? Promise.reject(new Error('no filesystem')),
      (error: unknown) =>
        error instanceof Error && Reflect.get(error, 'code') === 'MACHINE_UNAVAILABLE',
    )
  }
  assert.deepEqual(await asOwner(`select * from builder.machine`), [])
})

test('máquina: duas ferramentas no primeiro passo veem a semente, e um git commit do Builder vira uma versão, a mesma árvore', async (t) => {
  const { open, machines, repository, base, folder } = await world(t)
  const workspace = await open()
  const fs = workspace.filesystem
  assert.ok(fs && workspace.sandbox?.executeCommand)
  const [first, second] = await Promise.all([fs.exists('.git/HEAD'), fs.exists('.git/HEAD')])
  assert.deepEqual([first, second], [true, true])
  await fs.writeFile('src/a.ts', 'export const a = 1\n')
  const git = `git -c user.name=B -c user.email=b@x.test`
  const committed = await workspace.sandbox.executeCommand('sh', [
    '-c',
    `cd ${join(folder, 'app')} && git checkout -qb outro && git add -A && ${git} commit -qm um && echo dois > b.ts && git add -A && ${git} commit -qm dois`,
  ])
  assert.equal(committed.exitCode, 0, committed.stderr)
  const bundle = await machines.collect({ projectId: PROJECT, base })
  assert.ok(typeof bundle === 'object')
  const received = await repository.receive({
    runId: RunId.parse('00000000-0000-4000-8000-000000000001'),
    bundle: bundle.bundle,
    base,
  })
  assert.ok(received.ok)
  assert.equal(await repository.advance({ candidate: received.value, base }), 'advanced')
  assert.equal(await repository.version(), 1)
  assert.deepEqual(await repository.tree(received.value), [
    { path: 'b.ts', bytes: 5 },
    { path: 'src/a.ts', bytes: 19 },
  ])
})

test('máquina: o nome da máquina leva a instalação e a empresa, então a de outra instalação ou empresa nunca é a achada pelo nome', async (t) => {
  const here = await world(t)
  await here.open()
  const other = await world(t, 5_000, OTHER_INSTALLATION)
  await other.open()
  assert.deepEqual(here.control.names, [`conexus-${INSTALLATION}-${COMPANY}-${PROJECT}`])
  assert.deepEqual(other.control.names, [`conexus-${OTHER_INSTALLATION}-${COMPANY}-${PROJECT}`])
  assert.notEqual(here.control.names[0], other.control.names[0])
})

const OWN = `conexus-${INSTALLATION}-${COMPANY}-${PROJECT}`

test('máquina: a gravada com o nome antigo, de outra instalação ou de outra empresa nunca é ligada pelo id: vai para a trilha da refeita, sem matar a velha', async (t) => {
  const { open, phases, control, asOwner } = await world(t)
  await (await open()).filesystem?.exists('a.ts')
  for (const owner of [
    `conexus-${PROJECT}`,
    `conexus-${OTHER_INSTALLATION}-${COMPANY}-${PROJECT}`,
    `conexus-${INSTALLATION}-companyBBBBBBBBBBBBBBBBBBBBBBBBB-${PROJECT}`,
  ]) {
    control.owner = owner
    phases.length = 0
    const rebuilt = await open()
    await rebuilt.filesystem?.exists('a.ts')
    assert.deepEqual(phases, ['waking', 'replaced', 'copying'])
    assert.equal(control.reattached.at(-1), undefined, 'no id is asked for')
    assert.deepEqual(control.attached, [])
  }
  assert.equal(control.killed, false, 'the old machine is left alone')
  assert.equal((await asOwner(`select sandbox_id from builder.machine`)).length, 1)
})

test('máquina: sem id gravado, só a máquina de nome igual ao deste Projeto é achada; as de outra instalação ou empresa não', async (t) => {
  const { open, control, asOwner } = await world(t)
  control.discoverable = [
    `conexus-${PROJECT}`,
    `conexus-${OTHER_INSTALLATION}-${COMPANY}-${PROJECT}`,
    `conexus-${INSTALLATION}-companyBBBBBBBBBBBBBBBBBBBBBBBBB-${PROJECT}`,
  ]
  await (await open()).filesystem?.exists('a.ts')
  assert.deepEqual(control.attached, [], 'a created machine, none of the others')
  await asOwner('delete from builder.machine')
  control.discoverable = [OWN]
  await (await open()).filesystem?.exists('a.ts')
  assert.deepEqual(control.attached, [OWN], 'its own name is found')
})

test('máquina: o Git a restaurar passa pelo início da máquina sem virar MACHINE_UNAVAILABLE', async (t) => {
  const { open } = await world(t, 5_000, INSTALLATION, restoreRefused)
  await assert.rejects((await open()).filesystem?.exists('a.ts') ?? Promise.reject(), {
    code: 'GIT_RESTORE_NEEDED',
  })
})
