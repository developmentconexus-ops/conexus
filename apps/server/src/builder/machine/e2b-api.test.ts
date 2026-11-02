import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { testConfig, unreachableDatabaseUrl } from '../../platform/test-database.ts'
import { createE2bApi, MARK } from './public.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')
const CONVERSATION = ConversationId.parse('00000000-0000-4000-8000-00000000000a')

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

test('máquina: a busca do download lista pela marca, pela conversa e pelo template, devolve o id da primeira e nada mata; a lista que falha falha (B2)', async (t) => {
  const seen: string[] = []
  let down = false
  const server = createServer((request, response) => {
    seen.push(`${request.method} ${decodeURIComponent(request.url ?? '')}`)
    response.setHeader('content-type', 'application/json')
    if (down) response.statusCode = 500
    response.end(down ? '{"message":"down"}' : JSON.stringify([listed('sb-1')]))
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
  assert.equal(await api.find(CONVERSATION, 'conexus-builder:1111111'), 'sb-1')
  assert.equal(seen.length, 1, 'one list, and no kill')
  assert.match(seen[0] ?? '', new RegExp(`^GET .*conexus_conversation=${CONVERSATION}`))
  // The SDK encodes the metadata inside the query, as for the kill.
  assert.match(seen[0] ?? '', /conexus_template=conexus-builder%253A1111111/)
  down = true
  await assert.rejects(api.find(CONVERSATION, 'conexus-builder:1111111'))
})

/** One machine as E2B's list answers it. */
function listed(sandboxID: string) {
  const now = new Date().toISOString()
  return {
    ...{ sandboxID, templateID: 't', alias: 'a', clientID: 'c', startedAt: now, endAt: now },
    ...{ cpuCount: 2, memoryMB: 512, diskSizeMB: 1024, envdVersion: '0.1.0', state: 'paused' },
    metadata: { [MARK.origin]: 'hub.example.test', [MARK.conversation]: CONVERSATION },
  }
}

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
