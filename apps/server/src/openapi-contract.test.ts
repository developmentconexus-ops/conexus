import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { Operation } from '@conexus/hub-api'
import { getHealth, listCompanies } from '@conexus/hub-api'
import { z } from 'zod'
import { emitOpenApi } from '../../../scripts/emit-openapi.ts'
import { createStatus } from './hub/status/public.ts'
import { createHub, identityOf } from './main.ts'
import { createTestDatabase, TEST_ORIGIN, testConfig } from './platform/test-database.ts'

const silent = { info: () => undefined, error: () => undefined }

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

async function hubOn(t: TestContext) {
  const test = await createTestDatabase(t)
  const config = testConfig(test.runtimeUrl)
  const status = createStatus({ version: config.version, database: test.database })
  const identity = identityOf({ database: test.database, config, log: silent })
  const app = await createHub(config, { status, identity })
  t.after(() => app.close())
  return app
}

function declared(operation: Operation, status: number): string[] {
  const item = Document.parse(emitOpenApi()).paths[operation.path]?.[operation.method.toLowerCase()]
  return Object.keys(item?.responses[String(status)]?.content ?? {})
}

test('a resposta de sucesso sai com o status e o tipo que o documento declara', async (t) => {
  const app = await hubOn(t)
  const response = await app.inject({ method: 'GET', url: getHealth.path })
  assert.equal(response.statusCode, 200)
  assert.deepEqual(declared(getHealth, response.statusCode), ['application/json'])
  assert.equal(String(response.headers['content-type']).split(';')[0], 'application/json')
})

test('a falha sai com o status e o tipo que o documento declara', async (t) => {
  const app = await hubOn(t)
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
