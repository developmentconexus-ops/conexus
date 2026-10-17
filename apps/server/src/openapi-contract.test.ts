import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Operation } from '@conexus/hub-api'
import { createSession, getHealth, listCompanies, registerClient } from '@conexus/hub-api'
import { z } from 'zod'
import { emitOpenApi } from '../../../scripts/emit-openapi.ts'
import { hubOn } from './hub/identity/test-hub.ts'
import { TEST_ORIGIN, WRITE_HEADERS } from './platform/test-database.ts'

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

const PROBLEM = 'application/problem+json'

async function refusal(
  t: Parameters<typeof hubOn>[0],
  operation: Operation,
  request: { headers: Record<string, string>; payload?: string },
) {
  const { app } = await hubOn(t)
  const response = await app.inject({
    method: operation.method,
    url: operation.path,
    ...request,
  })
  assert.deepEqual(declared(operation, response.statusCode), [PROBLEM])
  assert.equal(String(response.headers['content-type']).split(';')[0], PROBLEM)
  return response
}

test('a recusa de origem de uma escrita sai com o status e o tipo que o documento declara', async (t) => {
  const response = await refusal(t, registerClient, {
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7' },
    payload: '{"name":"Acme"}',
  })
  assert.equal(response.statusCode, 403)
  assert.equal(response.json().code, 'REQUEST_ORIGIN_REFUSED')
})

test('o tipo de corpo recusado sai com o status e o tipo que o documento declara', async (t) => {
  const response = await refusal(t, createSession, {
    headers: { ...WRITE_HEADERS, 'content-type': 'text/plain' },
    payload: 'ana@example.test',
  })
  assert.equal(response.statusCode, 415)
  assert.equal(response.json().code, 'REQUEST_MEDIA_TYPE_REFUSED')
})

test('o corpo acima do limite e o pedido malformado saem como o documento declara', async (t) => {
  const large = await refusal(t, createSession, {
    headers: WRITE_HEADERS,
    payload: JSON.stringify({
      email: 'ana@example.test',
      password: 'x'.repeat(createSession.bodyLimit),
    }),
  })
  assert.equal(large.statusCode, 413)
  assert.equal(large.json().code, 'REQUEST_TOO_LARGE')
  const malformed = await refusal(t, createSession, {
    headers: WRITE_HEADERS,
    payload: '{"email":',
  })
  assert.equal(malformed.statusCode, 400)
  assert.equal(malformed.json().code, 'REQUEST_MALFORMED')
})
