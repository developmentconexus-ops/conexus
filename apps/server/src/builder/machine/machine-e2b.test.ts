import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { testConfig, unreachableDatabaseUrl } from '../../platform/test-database.ts'
import { APP_FOLDER, createE2bApi, createE2bKit, MARK, SandboxId } from './public.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')

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

test('máquina: na hora do turno a máquina segue ligada para guardar', async () => {
  const deadline = new Date(Date.now() + 30 * 60_000)
  const kit = createE2bKit(testConfig(await unreachableDatabaseUrl()))({
    id: `conexus-${PROJECT}`,
    sandboxId: undefined,
    deadline,
    metadata: {},
    onStart: () => undefined,
  })
  const timeout: number = Reflect.get(kit.sandbox, '_constructorOptions').timeout
  assert.ok(timeout > deadline.getTime() - Date.now() + 60_000, 'the machine outlives the hour')
})

test('máquina: o template trabalha na pasta do app em que as ferramentas trabalham', () => {
  const template = readFileSync(
    join(import.meta.dirname, '../../../../..', 'infra', 'e2b', 'template.ts'),
    'utf8',
  )
  assert.ok(
    template.includes(`.setWorkdir('${APP_FOLDER}')`),
    'the template works in the app folder',
  )
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
                [MARK.origin]: 'hub.example.test',
                [MARK.company]: COMPANY,
                [MARK.project]: PROJECT,
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
