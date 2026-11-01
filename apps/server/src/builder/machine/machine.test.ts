import assert from 'node:assert/strict'
import { truncateSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { RunId } from '@conexus/hub-api'
import { createWorkspaceTools, WORKSPACE_TOOLS } from '@mastra/core/workspace'
import { Failure } from '../../platform/failure.ts'
import {
  COMPANY,
  CONVERSATION,
  INSTALLATION,
  OLD_TEMPLATE,
  OTHER_CONVERSATION,
  OTHER_INSTALLATION,
  PROJECT,
  restoreRefused,
  sandboxOf,
  TEMPLATE,
  world,
} from './test-machine.ts'

const OWN = `conexus-${INSTALLATION}-${CONVERSATION}`

test('máquina: a conversa sem máquina liga e copia o main; a achada pelo nome traz o main com a rede fechada e guarda o que o turno anterior não salvou; a que sumiu entre turnos volta nova, do main, sem frase', async (t) => {
  const { open, phases, control, machines, base } = await world(t)
  const first = await open()
  assert.deepEqual(phases, [], 'building the workspace touches no machine')
  await first.filesystem?.writeFile('a.ts', 'um\n')
  assert.deepEqual(phases, ['starting', 'copying'])
  await machines.release(CONVERSATION)
  phases.length = 0
  control.discoverable = [OWN]
  const found = await open()
  assert.equal(
    await found.filesystem?.exists('a.ts'),
    true,
    'a turn that saved nothing leaves its work',
  )
  assert.deepEqual(phases, ['starting', 'copying'])
  assert.deepEqual(control.attached, [OWN])
  assert.equal(control.networkClosed, 1)
  await machines.release(CONVERSATION)
  phases.length = 0
  control.discoverable = []
  const fresh = await open()
  assert.equal(await fresh.filesystem?.exists('a.ts'), false)
  assert.deepEqual(phases, ['starting', 'copying'], 'no phase says a machine was there before')
  assert.equal(await machines.collect({ conversationId: CONVERSATION, base }), 'unchanged')
})

test('máquina: religada no turno seguinte, a mesma pasta segue no main que o turno salvou, e um commit em outro ramo não apaga a versão anterior', async (t) => {
  const { open, machines, repository, base, control, folder } = await world(t)
  const first = await open()
  const git = `git -c user.name=B -c user.email=b@x.test`
  await first.filesystem?.writeFile('a.ts', 'um\n')
  const committed = await (await sandboxOf(first)).executeCommand('sh', [
    '-c',
    `cd ${join(folder, 'app')} && git checkout -qb outro && git add -A && ${git} commit -qm um`,
  ])
  assert.equal(committed.exitCode, 0, committed.stderr)
  const bundle = await machines.collect({ conversationId: CONVERSATION, base })
  assert.ok(typeof bundle === 'object')
  assert.equal(bundle.changedFiles, 1)
  assert.ok(bundle.files > 1, 'the version holds the starter beside the turn')
  const received = await repository.receive({
    runId: RunId.parse('00000000-0000-4000-8000-000000000002'),
    bundle: bundle.bundle,
    base,
  })
  assert.ok(received.ok)
  assert.equal(await repository.advance({ candidate: received.value, base }), 'advanced')
  await machines.release(CONVERSATION)
  control.outcome = 'connected'
  const next = await open()
  assert.equal(await next.filesystem?.exists('a.ts'), true, 'the saved version is the folder')
  const head = await (await sandboxOf(next)).executeCommand('sh', [
    '-c',
    `cd ${join(folder, 'app')} && git symbolic-ref HEAD`,
  ])
  assert.equal(head.stdout.trim(), 'refs/heads/main')
  const second = await machines.collect({ conversationId: CONVERSATION, base: received.value })
  assert.equal(second, 'unchanged')
})

test('máquina: a máquina que cai no meio do turno é refeita, e o turno não guarda o que se perdeu', async (t) => {
  const { open, machines, base, control } = await world(t)
  const workspace = await open()
  await workspace.filesystem?.writeFile('a.ts', 'um\n')
  control.outcome = 'created'
  await control.restart()
  await assert.rejects(
    machines.collect({ conversationId: CONVERSATION, base }),
    (error) => error instanceof Failure && error.code === 'MACHINE_LOST',
  )
})

test('máquina: a máquina que pausou na hora do turno, ou que o Mastra religa no meio dele, guarda o que o turno escreveu', async (t) => {
  const { open, machines, base, control } = await world(t)
  const workspace = await open()
  await workspace.filesystem?.writeFile('a.ts', 'um\n')
  control.outcome = 'connected'
  await control.restart()
  assert.equal(await workspace.filesystem?.exists('a.ts'), true, 'a reconnect is not a new turn')
  const bundle = await machines.collect({ conversationId: CONVERSATION, base })
  assert.ok(typeof bundle === 'object', `the turn's work is saved, not ${String(bundle)}`)
  assert.equal(bundle.changedFiles, 1)
  assert.ok(bundle.files > 1, 'the version holds the starter beside the turn')
})

test('máquina: o turno que não terminou (o processo morreu) deixa os arquivos na máquina; religada, a mesma pasta os guarda e o turno seguinte os salva; o turno que terminou sem salvar também os deixa', async (t) => {
  const { open, machines, control, base } = await world(t)
  const ended = await open()
  await ended.filesystem?.writeFile('stray.ts', 'sobra\n')
  await machines.release(CONVERSATION)
  control.outcome = 'connected'
  const cut = await open()
  assert.equal(
    await cut.filesystem?.exists('stray.ts'),
    true,
    'an ended turn keeps what it did not save',
  )
  await cut.filesystem?.writeFile('a.ts', 'um\n')
  // The process died: no save, no end. The next turn finds the machine by its name.
  const after = await open()
  assert.equal(await after.filesystem?.exists('a.ts'), true, 'the cut turn is kept')
  assert.equal(await machines.changed({ conversationId: CONVERSATION }), true)
  const bundle = await machines.collect({ conversationId: CONVERSATION, base })
  assert.ok(typeof bundle === 'object', `the cut turn is saved, not ${String(bundle)}`)
  assert.equal(bundle.changedFiles, 2, 'the ended turn left its file beside the cut one')
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
  while (control.sandbox?.status !== 'running') await new Promise((later) => setTimeout(later, 5))
  const seen = [await first, await command.execute(head, { workspace })]
  for (const each of seen) assert.match(JSON.stringify(each), /ref: refs\/heads\/main/)
})

test('máquina: E2B calado passa do prazo externo e um 502 também, ambos MACHINE_UNAVAILABLE', async (t) => {
  const { open, control } = await world(t, 100)
  for (const start of ['hang', 'unreachable'] as const) {
    control.start = start
    const workspace = await open()
    await assert.rejects(
      workspace.filesystem?.exists('a.ts') ?? Promise.reject(new Error('no filesystem')),
      (error: unknown) =>
        error instanceof Error && Reflect.get(error, 'code') === 'MACHINE_UNAVAILABLE',
    )
  }
})

test('máquina: duas ferramentas no primeiro passo veem a semente, e um git commit do Builder vira uma versão, a mesma árvore', async (t) => {
  const { open, machines, repository, base, folder } = await world(t)
  const workspace = await open()
  const fs = workspace.filesystem
  assert.ok(fs)
  const [first, second] = await Promise.all([fs.exists('.git/HEAD'), fs.exists('.git/HEAD')])
  assert.deepEqual([first, second], [true, true])
  await fs.writeFile('src/a.ts', 'export const a = 1\n')
  const git = `git -c user.name=B -c user.email=b@x.test`
  const committed = await (await sandboxOf(workspace)).executeCommand('sh', [
    '-c',
    `cd ${join(folder, 'app')} && git checkout -qb outro && git add -A && ${git} commit -qm um && echo dois > b.ts && git add -A && ${git} commit -qm dois`,
  ])
  assert.equal(committed.exitCode, 0, committed.stderr)
  const bundle = await machines.collect({ conversationId: CONVERSATION, base })
  assert.ok(typeof bundle === 'object')
  const received = await repository.receive({
    runId: RunId.parse('00000000-0000-4000-8000-000000000001'),
    bundle: bundle.bundle,
    base,
  })
  assert.ok(received.ok)
  assert.equal(await repository.advance({ candidate: received.value, base }), 'advanced')
  assert.equal(await repository.version(), 1)
  const turn = new Set(['b.ts', 'src/a.ts'])
  const tree = (await repository.tree(received.value)) ?? []
  assert.deepEqual(
    tree.filter((file) => turn.has(file.path)),
    [
      { path: 'b.ts', bytes: 5 },
      { path: 'src/a.ts', bytes: 19 },
    ],
  )
})

test('máquina: o nome leva a instalação e a conversa, sem o Projeto, e a marca a conversa; duas conversas do Projeto, duas máquinas', async (t) => {
  const here = await world(t)
  await (await here.open()).filesystem?.exists('a.ts')
  await (await here.open(OTHER_CONVERSATION)).filesystem?.exists('a.ts')
  const other = await world(t, 5_000, OTHER_INSTALLATION)
  await (await other.open()).filesystem?.exists('a.ts')
  assert.deepEqual(here.control.names, [OWN, `conexus-${INSTALLATION}-${OTHER_CONVERSATION}`])
  assert.deepEqual(other.control.names, [`conexus-${OTHER_INSTALLATION}-${CONVERSATION}`])
  assert.deepEqual(here.control.marks[0], {
    conexus_origin: INSTALLATION,
    conexus_company: COMPANY,
    conexus_project: PROJECT,
    conexus_conversation: CONVERSATION,
    conexus_template: TEMPLATE,
  })
})

test('máquina: só a máquina de nome igual ao desta conversa é achada; a do Projeto, a de outra instalação e a de outra conversa não', async (t) => {
  const { open, control, machines } = await world(t)
  control.discoverable = [
    `conexus-${INSTALLATION}-${COMPANY}-${PROJECT}`,
    `conexus-${OTHER_INSTALLATION}-${CONVERSATION}`,
    `conexus-${INSTALLATION}-${OTHER_CONVERSATION}`,
  ]
  await (await open()).filesystem?.exists('a.ts')
  assert.deepEqual(control.attached, [], 'a created machine, none of the others')
  await machines.release(CONVERSATION)
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

test('máquina: um turno que só mexeu nos planos não guarda versão; com o app, os planos vão e não contam', async (t) => {
  const { open, machines, base } = await world(t)
  const workspace = await open()
  await workspace.filesystem?.writeFile('.conexus/plans/um.md', '# Um\n')
  assert.equal(await machines.changed({ conversationId: CONVERSATION }), false)
  assert.equal(await machines.collect({ conversationId: CONVERSATION, base }), 'unchanged')
  await workspace.filesystem?.writeFile('a.ts', 'um\n')
  assert.equal(await machines.changed({ conversationId: CONVERSATION }), true)
  const bundle = await machines.collect({ conversationId: CONVERSATION, base })
  assert.ok(typeof bundle === 'object')
  assert.equal(bundle.changedFiles, 1)
})

test('máquina: um pacote do turno maior que 64 MiB não entra no Hub', async (t) => {
  const { open, machines, base, control } = await world(t)
  const workspace = await open()
  await workspace.filesystem?.writeFile('a.ts', 'um\n')
  control.beforeRead = (path) => truncateSync(path, 65 * 1024 * 1024)
  const collected = await machines.collect({ conversationId: CONVERSATION, base })
  assert.equal(typeof collected === 'object' ? 'a bundle' : collected, 'too-large')
})

test('máquina: a pausada de um template anterior ao Release não é retomada; volta nova, do template do Hub, copiada do main', async (t) => {
  const { open, phases, control, machines } = await world(t)
  control.discoverable = [OWN]
  control.templates = { [OWN]: OLD_TEMPLATE }
  const workspace = await open()
  await workspace.filesystem?.writeFile('a.ts', 'um\n')
  assert.deepEqual(control.replaced, [OWN])
  assert.deepEqual(control.attached, [], 'the old machine is never resumed')
  assert.deepEqual(phases, ['starting', 'copying'])
  assert.equal(control.marks.at(-1)?.conexus_template, TEMPLATE)
  await machines.release(CONVERSATION)
  phases.length = 0
  control.discoverable = [OWN]
  control.templates = {}
  await (await open()).filesystem?.writeFile('b.ts', 'dois\n')
  assert.deepEqual(control.replaced, [OWN], 'a machine of the Hub template is kept')
  assert.deepEqual(control.attached, [OWN])
})
