import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { testConfig, unreachableDatabaseUrl } from '../../platform/test-database.ts'
import {
  APP_FOLDER,
  createE2bApi,
  createE2bKit,
  MARK,
  machineInstructions,
  SandboxId,
} from './public.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')
const IN_APP = { workingDirectory: APP_FOLDER, instructions: machineInstructions(APP_FOLDER) }

test('máquina: o kit do E2B nasce sem env, atrás da lista de domínios, pausando ao vencer, com a marca, na pasta do app e dizendo ao modelo o que a máquina tem', async () => {
  const kit = createE2bKit(testConfig(await unreachableDatabaseUrl()))({
    id: `conexus-${PROJECT}`,
    sandboxId: undefined,
    metadata: { conexus_origin: 'hub.example.test', conexus_project: PROJECT },
    onStart: () => undefined,
    ...IN_APP,
  })
  const options = Reflect.get(kit.sandbox, '_constructorOptions')
  assert.equal('env' in options, false)
  assert.deepEqual(options.network, { allowOut: ['registry.npmjs.org'], denyOut: ['0.0.0.0/0'] })
  assert.deepEqual(options.lifecycle, { onTimeout: 'pause' })
  assert.equal(options.metadata.conexus_origin, 'hub.example.test')
  assert.equal(options.workingDirectory, APP_FOLDER)
  const told = kit.sandbox.getInstructions?.() ?? ''
  assert.ok(told.includes(`Commands start in ${APP_FOLDER}`), told)
  assert.equal(told.includes('Cloud sandbox'), false)
  const woken = createE2bKit(testConfig(await unreachableDatabaseUrl()))({
    id: `conexus-${PROJECT}`,
    sandboxId: SandboxId.parse('sb-1'),
    metadata: {},
    onStart: () => undefined,
    ...IN_APP,
  })
  assert.equal(Reflect.get(woken.sandbox, '_constructorOptions').reattach, 'required')
})

test('máquina: o E2B a mantém uma hora, a mais longa do plano, e então a pausa; o turno não tem prazo próprio', async () => {
  const kit = createE2bKit(testConfig(await unreachableDatabaseUrl()))({
    id: `conexus-${PROJECT}`,
    sandboxId: undefined,
    metadata: {},
    onStart: () => undefined,
    ...IN_APP,
  })
  const options = Reflect.get(kit.sandbox, '_constructorOptions')
  assert.equal(options.timeout, 60 * 60 * 1000)
  assert.deepEqual(options.lifecycle, { onTimeout: 'pause' })
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
