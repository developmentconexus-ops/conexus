import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ProjectId, RunId } from '@conexus/hub-api'
import { createWorkspaceTools, WORKSPACE_TOOLS } from '@mastra/core/workspace'
import {
  createTestDatabase,
  testConfig,
  unreachableDatabaseUrl,
} from '../../platform/test-database.ts'
import { openRepository } from '../git/public.ts'
import type { Phase } from './public.ts'
import { createE2bApi, createE2bKit, createMachines, SandboxId } from './public.ts'
import { localKit, newControl } from './test-machine.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')
const LOG = { info: () => undefined, error: () => undefined }
const SEED = `
  insert into auth."user"(id, name, email) values ('person-a', 'Ana', 'ana@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${COMPANY}', 'Empresa A', 'key-a', now(), 'key-a');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', '${COMPANY}', 'person-a', 'member', now());
  insert into projects.project(id, company_id, name, attempt_key, created_at) values
    ('${PROJECT}', '${COMPANY}', 'Encomendas', 'a', now());`

async function world(t: TestContext, startMs = 5_000) {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  const folder = mkdtempSync(join(tmpdir(), 'conexus-machine-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  const repository = openRepository({
    root: join(folder, 'git'),
    companyId: COMPANY,
    projectId: PROJECT,
    log: LOG,
  })
  const base = await repository.ensure()
  const control = newControl()
  const machines = createMachines({
    database,
    kit: localKit(folder, control),
    api: { list: async () => [], kill: async () => undefined, exists: async () => control.exists },
    seedOf: () => repository.bundleOfMain(),
    mark: { conexus_origin: 'hub.example.test' },
    log: LOG,
    workdir: join(folder, 'app'),
    tmp: folder,
    startMs,
  })
  const phases: Phase[] = []
  function open() {
    return machines.workspaceFor({
      companyId: COMPANY,
      projectId: PROJECT,
      deadline: new Date(Date.now() + 3_600_000),
      onPhase: (phase) => phases.push(phase),
    })
  }
  return { asOwner, machines, repository, base, control, phases, open, folder }
}

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

test('máquina: a primeira ferramenta do Workspace espera a semente: o comando já vê o repositório', async (t) => {
  const { open, folder } = await world(t)
  const workspace = await open()
  const tools = await createWorkspaceTools(workspace)
  const command = tools[WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]
  assert.ok(command, 'the workspace offers execute_command')
  const seen = await command.execute(
    { command: `cat ${join(folder, 'app')}/.git/HEAD` },
    { workspace },
  )
  assert.match(JSON.stringify(seen), /ref: refs\/heads\/main/)
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

test('máquina: o kit do E2B nasce sem env, atrás da lista de domínios, pausando ao vencer, com a marca', async () => {
  const kit = createE2bKit(testConfig(await unreachableDatabaseUrl()))({
    id: `conexus-${PROJECT}`,
    sandboxId: undefined,
    deadline: new Date(Date.now() + 3_600_000),
    metadata: { conexus_origin: 'hub.example.test', conexus_project: PROJECT },
    onStart: () => undefined,
  })
  const options = Reflect.get(kit.sandbox, '_constructorOptions')
  assert.equal('env' in options, false)
  assert.deepEqual(options.network, { allowOut: ['registry.npmjs.org'], denyOut: ['0.0.0.0/0'] })
  assert.deepEqual(options.lifecycle, { onTimeout: 'pause' })
  assert.equal(options.metadata.conexus_origin, 'hub.example.test')
  const woken = createE2bKit(testConfig(await unreachableDatabaseUrl()))({
    id: `conexus-${PROJECT}`,
    sandboxId: SandboxId.parse('sb-1'),
    deadline: new Date(Date.now() + 3_600_000),
    metadata: {},
    onStart: () => undefined,
  })
  assert.equal(Reflect.get(woken.sandbox, '_constructorOptions').reattach, 'required')
})

test('máquina: a varredura lista só as máquinas com a marca desta instalação e mata a que se mandou', async (t) => {
  const seen: string[] = []
  const server = createServer((request, response) => {
    seen.push(`${request.method} ${request.url}`)
    response.setHeader('content-type', 'application/json')
    const listed = request.method === 'GET'
    response.end(
      listed
        ? JSON.stringify([
            {
              sandboxID: 'sb-1',
              templateID: 't',
              alias: 'a',
              clientID: 'c',
              startedAt: new Date().toISOString(),
              endAt: new Date().toISOString(),
              cpuCount: 2,
              memoryMB: 512,
              diskSizeMB: 1024,
              envdVersion: '0.1.0',
              state: 'paused',
              metadata: {
                conexus_origin: 'hub.example.test',
                conexus_company: COMPANY,
                conexus_project: PROJECT,
              },
            },
          ])
        : '',
    )
  })
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  t.after(() => server.close())
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const api = createE2bApi(
    testConfig(await unreachableDatabaseUrl()),
    { conexus_origin: 'hub.example.test' },
    `http://127.0.0.1:${address.port}`,
  )
  const found = await api.list()
  assert.deepEqual(
    found.map((item) => [item.id, item.projectId]),
    [['sb-1', PROJECT]],
  )
  assert.match(decodeURIComponent(seen[0] ?? ''), /metadata=conexus_origin=hub\.example\.test/)
  await api.kill(found[0]?.id ?? assert.fail('no machine listed'))
  assert.match(seen.at(-1) ?? '', /^DELETE \/sandboxes\/sb-1/)
})

test('máquina: ../fora.ts e um link para fora do app não abrem nem escrevem nada', async (t) => {
  const { open, folder } = await world(t)
  const workspace = await open()
  const fs = workspace.filesystem
  assert.ok(fs && workspace.sandbox?.executeCommand)
  await fs.writeFile('dentro.ts', 'ok\n')
  await workspace.sandbox.executeCommand('sh', [
    '-c',
    `ln -s ${folder} ${join(folder, 'app', 'saida')}`,
  ])
  for (const path of ['../fora.ts', '/etc/passwd', 'saida/fora.ts', 'saida']) {
    await assert.rejects(
      fs.writeFile(path, 'x'),
      (e: unknown) => e instanceof Error && e.name === 'PermissionError',
      path,
    )
    await assert.rejects(
      fs.readFile(path),
      (e: unknown) => e instanceof Error && e.name === 'PermissionError',
      path,
    )
  }
  assert.equal(await fs.readFile('dentro.ts', { encoding: 'utf8' }), 'ok\n')
})
