import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { test } from 'node:test'
import type { Operation } from '@conexus/hub-api'
import * as api from '@conexus/hub-api'
import { z } from 'zod'
import { emitOpenApi, operations } from './emit-openapi.ts'

const SCRIPT = resolve(import.meta.dirname, 'emit-openapi.ts')

const Document = z.object({
  openapi: z.string(),
  paths: z.record(
    z.string(),
    z.record(
      z.string(),
      z.object({
        operationId: z.string(),
        security: z.array(z.record(z.string(), z.array(z.string()))),
        parameters: z.array(z.object({ name: z.string(), in: z.string() })),
        requestBody: z.unknown().optional(),
        responses: z.record(z.string(), z.unknown()),
      }),
    ),
  ),
})

test('o documento tem um operationId por operação declarada, sem repetir', () => {
  const declared = operations().map((operation) => operation.id)
  assert.ok(declared.length > 0)
  const emitted = Object.values(Document.parse(emitOpenApi()).paths).flatMap((item) =>
    Object.values(item).map((operation) => operation.operationId),
  )
  assert.deepEqual([...emitted].sort(), [...declared].sort())
  assert.equal(new Set(emitted).size, emitted.length)
})

test('a passagem ao app é uma navegação, não uma operação: o documento não a traz', () => {
  const document = Document.parse(emitOpenApi())
  const ids = Object.values(document.paths).flatMap((item) =>
    Object.values(item).map((operation) => operation.operationId),
  )
  assert.equal(ids.includes('createAppHandoff'), false)
  assert.deepEqual(
    Object.keys(document.paths).filter((path) => /^\/apps\/open|\/passagem/.test(path)),
    [],
  )
})

test('uma operação traz parâmetros, corpo e falhas pelo status HTTP', () => {
  const document = Document.parse(emitOpenApi())
  const operation = document.paths['/api/companies/{companyId}/invitations']?.post
  assert.equal(document.openapi, '3.1.0')
  assert.equal(operation?.operationId, 'createInvitation')
  assert.deepEqual(
    operation?.parameters.map((p) => `${p.in}:${p.name}`),
    ['path:companyId', 'header:Idempotency-Key'],
  )
  assert.ok(operation?.requestBody)
  assert.deepEqual(Object.keys(operation?.responses ?? {}), [
    '201',
    '400',
    '401',
    '403',
    '404',
    '409',
    '412',
    '413',
    '415',
    '422',
    '429',
    '500',
    '502',
    '503',
  ])
})

test('o comando emite JSON válido e sai com zero', () => {
  const result = spawnSync('node', [SCRIPT], { encoding: 'utf8', timeout: 120_000 })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(Document.parse(JSON.parse(result.stdout)).openapi, '3.1.0')
})

test('o acesso declarado vira security: sessão exige o cookie, público e entrada vão sem', () => {
  const document = Document.parse(emitOpenApi())
  const emitted = new Map(
    Object.values(document.paths).flatMap((item) =>
      Object.values(item).map((operation) => [operation.operationId, operation.security] as const),
    ),
  )
  const accessOf = new Map(operations().map((operation) => [operation.id, operation.access]))
  assert.ok(new Set(accessOf.values()).has('session'))
  assert.ok(new Set(accessOf.values()).has('public'))
  assert.ok(new Set(accessOf.values()).has('entry'))
  for (const [id, security] of emitted) {
    assert.deepEqual(security, accessOf.get(id) === 'session' ? [{ cookieSession: [] }] : [], id)
  }
  assert.deepEqual(Z_SCHEMES.parse(emitOpenApi()).components.securitySchemes, {
    cookieSession: { type: 'apiKey', in: 'cookie', name: '__Host-conexus_session' },
  })
})

const Z_SCHEMES = z.object({
  components: z.object({ securitySchemes: z.record(z.string(), z.unknown()) }),
})

const PLANTED = {
  id: 'planted',
  summary: 'A planted operation.',
  access: 'session',
  method: 'POST',
  path: '/api/planted',
  bodyLimit: 1024,
  input: { body: z.object({ when: z.date() }) },
  success: { status: 204 },
  failures: [],
} satisfies Operation

test('um esquema sem forma JSON recusa o documento, nomeando a operação', () => {
  assert.throws(() => emitOpenApi([PLANTED]), /^Error: planted has a schema with no JSON form$/)
})

test('o comando recusa um esquema sem forma JSON: sai com 1 e nada vai à saída', () => {
  const program = `
    import { z } from 'zod'
    import { emitCommand } from ${JSON.stringify(SCRIPT)}
    emitCommand([], [{ id: 'planted', summary: 'x', access: 'session', method: 'POST',
      path: '/api/planted', bodyLimit: 1, input: { body: z.object({ when: z.date() }) },
      success: { status: 204 }, failures: [] }])
  `
  const result = spawnSync('node', ['--input-type=module', '--eval', program], {
    cwd: resolve(import.meta.dirname, '..'),
    encoding: 'utf8',
    timeout: 120_000,
  })
  assert.equal(result.status, 1)
  assert.equal(result.stdout, '')
  assert.match(result.stderr, /planted has a schema with no JSON form/)
})

test('um export que não passou por defineOperation não é emitido, ainda que tenha a forma', () => {
  const stray = {
    id: 'strayRead',
    summary: 'A stray export shaped like an operation.',
    access: 'public',
    method: 'GET',
    path: '/api/stray',
    bodyLimit: 1,
    success: { status: 204 },
    failures: [],
  } satisfies Operation
  const intruders = { ...api, stray, notOperation: { id: 'x', method: 'y', path: '/api/other' } }
  const ids = operations(intruders).map((operation) => operation.id)
  assert.deepEqual(
    ids,
    operations().map((operation) => operation.id),
  )
  assert.ok(!ids.includes('strayRead'))
  const paths = Object.keys(Document.parse(emitOpenApi(operations(intruders))).paths)
  assert.ok(!paths.includes('/api/stray') && !paths.includes('/api/other'))
  const declared = api.defineOperation(stray)
  assert.deepEqual(
    operations({ ...intruders, declared }).map((operation) => operation.id),
    [...ids, 'strayRead'],
  )
})

test('um corpo de sucesso é application/json, uma falha é application/problem+json', () => {
  const responses = Document.parse(emitOpenApi()).paths['/api/companies/{companyId}/invitations']
    ?.post?.responses
  function contentTypes(status: string) {
    return Object.keys(Z_CONTENT.parse(responses?.[status]).content)
  }
  assert.deepEqual(contentTypes('201'), ['application/json'])
  assert.deepEqual(contentTypes('401'), ['application/problem+json'])
})

const Z_CONTENT = z.object({ content: z.record(z.string(), z.unknown()) })

test('o limite do corpo não é emitido, e uma transformação em entrada converte sem recusa', () => {
  const transformed = {
    ...PLANTED,
    bodyLimit: 7_654_321,
    input: { body: z.string().transform((text) => text.length) },
  } satisfies Operation
  const text = JSON.stringify(emitOpenApi([transformed]))
  assert.match(text, /"\/api\/planted"/)
  assert.doesNotMatch(text, /bodyLimit|7654321|"x-/)
})
