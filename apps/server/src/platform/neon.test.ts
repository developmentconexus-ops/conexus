import assert from 'node:assert/strict'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId } from '@conexus/hub-api'
import {
  companyProjectName,
  createNeonProjects,
  NEON_CALL_BUDGET_MS,
  NeonProjectId,
  NeonProjectName,
} from './neon.ts'
import { testConfig, unreachableDatabaseUrl } from './test-database.ts'

type Received = { method: string; path: string; authorization: string | undefined; body: string }
type Reply = (response: ServerResponse, received: Received) => void

const NAME = companyProjectName(CompanyId.parse('a'.repeat(32)))

function json(status: number, body: unknown): Reply {
  return (response) => {
    response.writeHead(status, { 'content-type': 'application/json' })
    response.end(JSON.stringify(body))
  }
}

const finished = [{ id: 'op-1', project_id: 'p', status: 'finished', action: 'create_timeline' }]

function project(id: string, name: string) {
  return { id, name, region_id: 'aws-sa-east-1', pg_version: 18 }
}

/** A fake of Neon's API (T14): it records each request and answers with `reply`. */
async function fakeNeon(t: TestContext, reply: Reply) {
  const received: Received[] = []
  const server = createServer((request: IncomingMessage, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const entry = {
        method: request.method ?? '',
        path: request.url ?? '',
        authorization: request.headers.authorization,
        body: Buffer.concat(chunks).toString('utf8'),
      }
      received.push(entry)
      reply(response, entry)
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const lines: { fields: Record<string, unknown>; message: string }[] = []
  const log = {
    info: (fields: Record<string, unknown>, message: string) => lines.push({ fields, message }),
    error: (fields: Record<string, unknown>, message: string) => lines.push({ fields, message }),
  }
  const config = testConfig(
    await unreachableDatabaseUrl(),
    undefined,
    `http://127.0.0.1:${address.port}/api/v2`,
  )
  return { neon: createNeonProjects({ config, log }), received, lines, config }
}

test('neon: find devolve só o nome exato, na organização, com a chave', async (t) => {
  const { neon, received, config } = await fakeNeon(
    t,
    json(200, {
      projects: [
        project('exact-1', NAME),
        project('longer-1', `${NAME}x`),
        project('other-1', 'cx-b'),
      ],
    }),
  )
  assert.deepEqual(await neon.find(NAME), { kind: 'DONE', value: [NeonProjectId.parse('exact-1')] })
  const [call] = received
  assert.equal(call?.method, 'GET')
  const url = new URL(call?.path ?? '', 'http://x')
  assert.equal(url.pathname, '/api/v2/projects')
  assert.equal(url.searchParams.get('search'), NAME)
  assert.equal(url.searchParams.get('org_id'), config.neonOrgId)
  assert.equal(call?.authorization, `Bearer ${config.neonApiKey.reveal()}`)
})

test('neon: find sem nenhum nome exato devolve a lista vazia', async (t) => {
  const { neon } = await fakeNeon(t, json(200, { projects: [project('longer-1', `${NAME}x`)] }))
  assert.deepEqual(await neon.find(NAME), { kind: 'DONE', value: [] })
})

test('neon: create pede São Paulo, PostgreSQL 18, a organização e o nome', async (t) => {
  const { neon, received, config } = await fakeNeon(
    t,
    json(201, { project: project('new-1', NAME), operations: finished }),
  )
  assert.deepEqual(await neon.create(NAME), { kind: 'DONE', value: NeonProjectId.parse('new-1') })
  const [call] = received
  assert.equal(call?.method, 'POST')
  assert.equal(new URL(call?.path ?? '', 'http://x').pathname, '/api/v2/projects')
  assert.deepEqual(JSON.parse(call?.body ?? ''), {
    project: {
      name: NAME,
      region_id: 'aws-sa-east-1',
      pg_version: 18,
      org_id: config.neonOrgId,
    },
  })
})

test('neon: delete apaga pelo id; o id ausente conta como apagado', async (t) => {
  const present = await fakeNeon(
    t,
    json(200, { project: project('gone-1', NAME), operations: finished }),
  )
  assert.deepEqual(await present.neon.delete(NeonProjectId.parse('gone-1')), {
    kind: 'DONE',
    value: 'deleted',
  })
  assert.equal(present.received[0]?.method, 'DELETE')
  assert.equal(
    new URL(present.received[0]?.path ?? '', 'http://x').pathname,
    '/api/v2/projects/gone-1',
  )

  const absent = await fakeNeon(t, json(404, { code: '', message: 'project not found' }))
  assert.deepEqual(await absent.neon.delete(NeonProjectId.parse('gone-1')), {
    kind: 'DONE',
    value: 'deleted',
  })
})

test('neon: resposta de recusa vira REFUSED, em cada chamada', async (t) => {
  const { neon, lines } = await fakeNeon(t, json(400, { code: 'BAD', message: 'no' }))
  assert.deepEqual(await neon.find(NAME), { kind: 'REFUSED' })
  assert.deepEqual(await neon.create(NAME), { kind: 'REFUSED' })
  assert.deepEqual(await neon.delete(NeonProjectId.parse('p-1')), { kind: 'REFUSED' })
  assert.deepEqual(lines, Array(3).fill({ fields: { reason: 'api' }, message: 'NEON_FAILED' }))
})

test('neon: conexão cortada vira NO_ANSWER, em cada chamada', async (t) => {
  const { neon, lines } = await fakeNeon(t, (response) => response.destroy())
  assert.deepEqual(await neon.find(NAME), { kind: 'NO_ANSWER' })
  assert.deepEqual(await neon.create(NAME), { kind: 'NO_ANSWER' })
  assert.deepEqual(await neon.delete(NeonProjectId.parse('p-1')), { kind: 'NO_ANSWER' })
  assert.deepEqual(
    lines.map((line) => line.fields.reason),
    ['network', 'network', 'network'],
  )
})

test('neon: resposta maior que o teto vira NO_ANSWER, sem ler o resto', async (t) => {
  const { neon, lines } = await fakeNeon(t, (response) => {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(`{"projects":[],"padding":"${'x'.repeat(2 * 1024 * 1024)}"}`)
  })
  assert.deepEqual(await neon.find(NAME), { kind: 'NO_ANSWER' })
  assert.equal(lines.length, 1)
})

test('neon: chave recusada é falha do sistema, e a chave não vai ao registro nem à falha', async (t) => {
  const { neon, lines, config } = await fakeNeon(
    t,
    json(401, { code: 'UNAUTH', message: 'bad key' }),
  )
  const failure = await neon.find(NAME).catch((error: unknown) => error)
  assert.ok(failure instanceof Error)
  assert.equal(Reflect.get(failure, 'code'), 'INTERNAL_UNEXPECTED')
  const key = config.neonApiKey.reveal()
  assert.equal(
    JSON.stringify([lines, failure.message, Reflect.get(failure, 'details')]).includes(key),
    false,
  )
  assert.equal(String(config.neonApiKey).includes(key), false)
})

test('neon: o nome de projeto só aceita cx- e o id da empresa', () => {
  assert.equal(NAME, `cx-${'a'.repeat(32)}`)
  for (const bad of ['', 'cx-', 'cx-a/b', 'other-a', 'cx-a b']) {
    assert.equal(NeonProjectName.safeParse(bad).success, false, bad)
  }
})

test('neon: o orçamento de uma chamada soma o pedido e a espera', () => {
  assert.equal(NEON_CALL_BUDGET_MS, 60_000)
})
