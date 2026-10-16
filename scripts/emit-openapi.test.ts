import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { test } from 'node:test'
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
    '401',
    '403',
    '404',
    '409',
    '422',
    '429',
    '502',
    '503',
  ])
})

test('o comando emite JSON válido e sai com zero', () => {
  const result = spawnSync('node', [SCRIPT], { encoding: 'utf8', timeout: 120_000 })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(Document.parse(JSON.parse(result.stdout)).openapi, '3.1.0')
})
