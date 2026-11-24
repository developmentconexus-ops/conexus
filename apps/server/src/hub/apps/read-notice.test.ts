import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { APP_SESSION_HEADER, QUERY_SQL_MAX } from '@conexus/hub-api'
import type { Hub } from '../identity/test-hub.ts'
import { codeOf } from '../identity/test-hub.ts'
import { opened } from './test-conference.ts'
import { companyWithApps, ESTOQUE, PEDIDOS, PEDIDOS_PREVIA, sessionOf } from './test-handoff.ts'
import { companyForVersions } from './test-versions.ts'

const QUERY = 'select count(*) from sankhya_vendas'

function notice(hub: Hub, host: string, session: string | undefined, body: object) {
  return hub.edge.inject({
    method: 'POST',
    url: `/api/app-reads?host=${host}`,
    headers: {
      'content-type': 'application/json',
      ...(session === undefined ? {} : { [APP_SESSION_HEADER]: session }),
    },
    payload: JSON.stringify(body),
  })
}

function bodyOf(overrides: object = {}) {
  return { id: randomUUID(), query: QUERY, outcome: 'ROWS', rows: 1, ms: 12, ...overrides }
}

function linesOf(hub: Hub, companyId: string) {
  return hub.test.asOwner('select * from data.data_read where company_id = $1 order by at, id', [
    companyId,
  ])
}

test('a consulta do app deixa uma linha APP', async (t) => {
  const { hub, bruno, companyId, projectId } = await companyWithApps(t)
  const session = await sessionOf(hub, bruno, PEDIDOS)
  const body = bodyOf()
  const sent = await notice(hub, PEDIDOS, session, body)
  assert.equal(sent.statusCode, 204, sent.body)
  const refused = await notice(hub, PEDIDOS, '_'.repeat(43), bodyOf({ outcome: '42501' }))
  const elsewhere = await notice(hub, ESTOQUE, session, bodyOf())
  const missing = await notice(hub, PEDIDOS, undefined, bodyOf())
  assert.deepEqual(
    [refused, elsewhere, missing].map((response) => [response.statusCode, codeOf(response)]),
    Array(3).fill([401, 'APP_SESSION_INVALID']),
  )
  const [line, ...more] = await linesOf(hub, companyId)
  assert.deepEqual(more, [])
  assert.deepEqual(
    { ...line, at: undefined },
    {
      ...{ id: body.id, company_id: companyId, at: undefined, person_id: bruno.id },
      ...{ agent: 'APP', project_id: projectId, agent_id: null, thread_id: null },
      ...{ verb: 'QUERY', tables: [], connection_id: null, operation: null },
      ...{ query: QUERY, outcome: 'ROWS', rows: 1, ms: 12 },
    },
  )
})

test('no host da Prévia, a consulta grava a linha para a pessoa da sessão', async (t) => {
  const { hub, bruno, companyId, projectId } = await companyWithApps(t)
  const session = await sessionOf(hub, bruno, PEDIDOS_PREVIA)
  const sent = await notice(hub, PEDIDOS_PREVIA, session, bodyOf())
  assert.equal(sent.statusCode, 204, sent.body)
  const crossed = await notice(hub, PEDIDOS, session, bodyOf())
  assert.deepEqual([crossed.statusCode, codeOf(crossed)], [401, 'APP_SESSION_INVALID'])
  const lines = await linesOf(hub, companyId)
  assert.deepEqual(
    lines.map((line) => [line.person_id, line.project_id, line.agent]),
    [[bruno.id, projectId, 'APP']],
  )
})

test('o aviso repetido não duplica', async (t) => {
  const { hub, ana, companyId } = await companyWithApps(t)
  const session = await sessionOf(hub, ana, PEDIDOS)
  const body = bodyOf({ outcome: '42P01', rows: null })
  const together = await Promise.all([1, 2].map(() => notice(hub, PEDIDOS, session, body)))
  const later = await notice(hub, PEDIDOS, session, body)
  assert.deepEqual(
    [...together, later].map((response) => response.statusCode),
    [204, 204, 204],
  )
  const lines = await linesOf(hub, companyId)
  assert.deepEqual(
    lines.map((line) => [line.id, line.outcome, line.rows]),
    [[body.id, '42P01', null]],
  )
})

test('o aviso não escolhe a pessoa nem o Projeto', async (t) => {
  const { hub, ana, bruno, companyId } = await companyWithApps(t)
  const session = await sessionOf(hub, bruno, PEDIDOS)
  const [other] = await hub.test.asOwner(
    `select id from projects.project where company_id = $1 and name = 'Estoque'`,
    [companyId],
  )
  const chosen = [
    bodyOf({ projectId: other?.id }),
    bodyOf({ personId: ana.id }),
    bodyOf({ companyId }),
  ]
  for (const body of chosen) {
    const sent = await notice(hub, PEDIDOS, session, body)
    assert.deepEqual([sent.statusCode, codeOf(sent)], [400, 'REQUEST_MALFORMED'])
  }
  assert.deepEqual(await linesOf(hub, companyId), [])
})

test('a consulta no limite cabe na linha; uma maior é recusada pelo contrato', async (t) => {
  const { hub, bruno, companyId } = await companyWithApps(t)
  const session = await sessionOf(hub, bruno, PEDIDOS)
  const query = `${QUERY} -- ${'x'.repeat(QUERY_SQL_MAX - QUERY.length - 4)}`
  assert.equal(query.length, QUERY_SQL_MAX)
  assert.equal((await notice(hub, PEDIDOS, session, bodyOf({ query }))).statusCode, 204)
  const longer = await notice(hub, PEDIDOS, session, bodyOf({ query: `${query}x` }))
  assert.deepEqual([longer.statusCode, codeOf(longer)], [400, 'REQUEST_MALFORMED'])
  const lines = await linesOf(hub, companyId)
  assert.deepEqual(
    lines.map((line) => line.query),
    [query],
  )
})

test('sem linha, o aviso responde 503 e a borda manda de novo', async (t) => {
  const { hub, bruno, companyId } = await companyWithApps(t)
  const session = await sessionOf(hub, bruno, PEDIDOS)
  await hub.test.asOwner(`create function data.refuse_read() returns trigger language plpgsql as $$
    begin raise exception 'down' using errcode = '57P01'; end $$`)
  await hub.test.asOwner(
    'create trigger refuse before insert on data.data_read for each row execute function data.refuse_read()',
  )
  const body = bodyOf()
  const down = await notice(hub, PEDIDOS, session, body)
  assert.deepEqual([down.statusCode, codeOf(down)], [503, 'DATABASE_UNAVAILABLE'])
  await hub.test.asOwner('drop trigger refuse on data.data_read')
  assert.equal((await notice(hub, PEDIDOS, session, body)).statusCode, 204)
  assert.deepEqual(
    (await linesOf(hub, companyId)).map((line) => line.id),
    [body.id],
  )
})

test('a consulta da conferência não escreve linha; a mesma na Prévia escreve a de hoje', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, companyId, projectId } = subject
  const { session } = await opened(subject, ana)
  const inCheck = await notice(hub, PEDIDOS, session, bodyOf())
  assert.equal(inCheck.statusCode, 204, inCheck.body)
  assert.deepEqual(await linesOf(hub, companyId), [])
  const previa = await sessionOf(hub, ana, PEDIDOS_PREVIA)
  assert.equal((await notice(hub, PEDIDOS_PREVIA, previa, bodyOf())).statusCode, 204)
  const lines = await linesOf(hub, companyId)
  assert.deepEqual(
    lines.map((line) => [line.person_id, line.project_id, line.agent]),
    [[ana.id, projectId, 'APP']],
  )
})
