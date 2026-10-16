import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Operation } from '@conexus/hub-api'
import { getHealth, listCompanies } from '@conexus/hub-api'
import { z } from 'zod'
import { emitOpenApi } from '../../../scripts/emit-openapi.ts'
import { hubOn } from './hub/identity/test-hub.ts'
import { TEST_ORIGIN } from './platform/test-database.ts'

const Document = z.object({
  paths: z.record(
    z.string(),
    z.record(
      z.string(),
      z.object({
        responses: z.record(
          z.string(),
          z.object({ content: z.record(z.string(), z.unknown()).optional() }),
        ),
      }),
    ),
  ),
})

function declared(operation: Operation, status: number): string[] {
  const item = Document.parse(emitOpenApi()).paths[operation.path]?.[operation.method.toLowerCase()]
  return Object.keys(item?.responses[String(status)]?.content ?? {})
}

test('a resposta de sucesso sai com o status e o tipo que o documento declara', async (t) => {
  const { app } = await hubOn(t)
  const response = await app.inject({ method: 'GET', url: getHealth.path })
  assert.equal(response.statusCode, 200)
  assert.deepEqual(declared(getHealth, response.statusCode), ['application/json'])
  assert.equal(String(response.headers['content-type']).split(';')[0], 'application/json')
})

test('a falha sai com o status e o tipo que o documento declara', async (t) => {
  const { app } = await hubOn(t)
  const response = await app.inject({
    method: 'GET',
    url: listCompanies.path,
    headers: { origin: TEST_ORIGIN, 'cf-connecting-ip': '203.0.113.7' },
  })
  assert.equal(response.statusCode, 401)
  assert.equal(response.json().code, 'SESSION_REQUIRED')
  assert.deepEqual(declared(listCompanies, response.statusCode), ['application/problem+json'])
  assert.equal(String(response.headers['content-type']).split(';')[0], 'application/problem+json')
})
