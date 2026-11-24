import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import * as contract from '@conexus/hub-api'
import { call, codeOf, companyOn, post } from '../identity/test-hub.ts'

type Route = readonly [method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string]

/** Ana's company with a Projeto: the owner reaches every route a copy ever had. */
async function owned(t: TestContext) {
  const on = await companyOn(t)
  const made = await post(on.hub, on.ana, `/api/companies/${on.companyId}/projects`, {
    name: 'Pedidos',
  })
  assert.equal(made.statusCode, 201, made.body)
  return { ...on, projectId: String(Object(made.json()).project.id) }
}

async function answeredGone(on: Awaited<ReturnType<typeof owned>>, routes: readonly Route[]) {
  for (const [method, url] of routes) {
    const answered =
      method === 'POST'
        ? await post(on.hub, on.ana, url, {})
        : await call(on.hub, on.ana, method, url, method === 'GET' ? undefined : {})
    assert.deepEqual(
      [answered.statusCode, codeOf(answered)],
      [404, 'NOT_FOUND'],
      `${method} ${url}`,
    )
  }
}

function notInContract(names: readonly string[]) {
  for (const name of names) assert.equal(Object.hasOwn(contract, name), false, name)
}

test('o que cria cópia saiu', async (t) => {
  const on = await owned(t)
  const company = `/api/companies/${on.companyId}`
  const copy = `${company}/copies/${randomUUID()}`
  await answeredGone(on, [
    ['GET', `${company}/copy-models`],
    ['POST', `${company}/copies`],
    ['POST', `${company}/copy-proposals/${randomUUID()}/dismiss`],
    ['POST', `${copy}/pause`],
    ['POST', `${copy}/resume`],
    ['PATCH', copy],
    ['POST', `${copy}/run`],
    ['DELETE', copy],
  ])
  notInContract(['listCopyModels'])
})

test('o que lê saiu', async (t) => {
  const on = await owned(t)
  const company = `/api/companies/${on.companyId}`
  const copyId = randomUUID()
  const project = `${company}/projects/${on.projectId}`
  await answeredGone(on, [
    ['GET', `${company}/copies`],
    ['GET', `${company}/copies/${copyId}/runs`],
    ['GET', `${company}/copies/${copyId}/sample`],
    ['GET', `${company}/copy-readers`],
    ['PUT', `${company}/roles/atendente/copies`],
    ['GET', `${project}/copies`],
    ['PUT', `${project}/copies/${copyId}`],
    ['DELETE', `${project}/copies/${copyId}`],
    ['GET', `${project}/copy-tables/sankhya_vendas/rows`],
  ])
  notInContract([
    ...['listCopies', 'listCopyRuns', 'sampleCopy', 'listCopyReaders', 'setRoleCopies'],
    ...['listProjectCopies', 'grantProjectCopy', 'revokeProjectCopy', 'listCopyRows'],
  ])
})
