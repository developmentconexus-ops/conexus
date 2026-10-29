import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { testConfig, unreachableDatabaseUrl } from '../../platform/test-database.ts'
import { APP_FOLDER, createE2bApi, createE2bKit, MARK, machineInstructions } from './public.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')
const CONVERSATION = ConversationId.parse('00000000-0000-4000-8000-00000000000a')
const IN_APP = { workingDirectory: APP_FOLDER, instructions: machineInstructions(APP_FOLDER) }

test('máquina: o kit do E2B nasce sem env e sem id gravado, achado pelo nome, atrás da lista de domínios, pausando ao vencer, com a marca da conversa, na pasta do app e dizendo ao modelo o que a máquina tem', async () => {
  const kit = createE2bKit(testConfig(await unreachableDatabaseUrl()))({
    id: `conexus-hub-${CONVERSATION}`,
    metadata: { conexus_origin: 'hub.example.test', conexus_conversation: CONVERSATION },
    onStart: () => undefined,
    ...IN_APP,
  })
  const options = Reflect.get(kit.sandbox, '_constructorOptions')
  assert.equal('env' in options, false)
  assert.equal(options.id, `conexus-hub-${CONVERSATION}`)
  assert.equal('sandboxId' in options, false)
  assert.equal('reattach' in options, false)
  assert.deepEqual(options.network, { allowOut: ['registry.npmjs.org'], denyOut: ['0.0.0.0/0'] })
  assert.deepEqual(options.lifecycle, { onTimeout: 'pause' })
  assert.equal(options.metadata.conexus_origin, 'hub.example.test')
  assert.equal(options.metadata.conexus_conversation, CONVERSATION)
  assert.equal(options.workingDirectory, APP_FOLDER)
  const told = kit.sandbox.getInstructions?.() ?? ''
  assert.ok(told.includes(`Commands start in ${APP_FOLDER}`), told)
  assert.equal(told.includes('Cloud sandbox'), false)
})

test('máquina: o E2B a mantém uma hora, a mais longa do plano, e então a pausa; o turno não tem prazo próprio', async () => {
  const kit = createE2bKit(testConfig(await unreachableDatabaseUrl()))({
    id: `conexus-hub-${CONVERSATION}`,
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

test('máquina: a morte lista pela marca desta instalação e pela conversa, e mata cada uma, também a segunda de mesmo nome', async (t) => {
  const seen: string[] = []
  const server = createServer((request, response) => {
    seen.push(`${request.method} ${request.url}`)
    response.setHeader('content-type', 'application/json')
    const listed = request.method === 'GET'
    response.end(
      listed
        ? JSON.stringify(
            ['sb-1', 'sb-2'].map((sandboxID) => ({
              sandboxID,
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
                [MARK.conversation]: CONVERSATION,
              },
            })),
          )
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
  assert.equal(await api.kill(CONVERSATION), 2)
  const listed = decodeURIComponent(seen[0] ?? '')
  assert.match(listed, /^GET .*metadata=conexus_origin=hub\.example\.test/)
  assert.match(listed, new RegExp(`conexus_conversation=${CONVERSATION}`))
  assert.deepEqual(
    seen.slice(1).map((line) => line.split('?')[0]),
    ['DELETE /sandboxes/sb-1', 'DELETE /sandboxes/sb-2'],
  )
})

test('máquina: um E2B que falha na lista faz a morte falhar, sem dizer pronto', async (t) => {
  const server = createServer((_request, response) => {
    response.statusCode = 500
    response.end('{"message":"down"}')
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
  await assert.rejects(api.kill(CONVERSATION))
})

test('máquina: depois de um Release, mata só as da conversa de outro template ou sem template, e guarda a do template do Hub', async (t) => {
  const seen: string[] = []
  const machines = {
    'sb-old': 'conexus-builder:0000000',
    'sb-none': undefined,
    'sb-new': 'conexus-builder:1111111',
  }
  const server = createServer((request, response) => {
    seen.push(`${request.method} ${request.url}`)
    response.setHeader('content-type', 'application/json')
    if (request.method !== 'GET') return response.end('')
    response.end(
      JSON.stringify(
        Object.entries(machines).map(([sandboxID, template]) => ({
          sandboxID,
          templateID: 't',
          alias: 'conexus-builder',
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
            [MARK.conversation]: CONVERSATION,
            ...(template === undefined ? {} : { [MARK.template]: template }),
          },
        })),
      ),
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
  assert.equal(await api.killStale(CONVERSATION, 'conexus-builder:1111111'), 2)
  assert.match(
    decodeURIComponent(seen[0] ?? ''),
    new RegExp(`conexus_conversation=${CONVERSATION}`),
  )
  assert.deepEqual(
    seen.slice(1).map((line) => line.split('?')[0]),
    ['DELETE /sandboxes/sb-old', 'DELETE /sandboxes/sb-none'],
  )
})
