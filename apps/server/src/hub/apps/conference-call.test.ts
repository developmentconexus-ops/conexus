import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { APP_SESSION_HEADER } from '@conexus/hub-api'
import type { Hub } from '../identity/test-hub.ts'
import { call, codeOf } from '../identity/test-hub.ts'
import { opened } from './test-conference.ts'
import { PEDIDOS, PEDIDOS_PREVIA, sessionOf } from './test-handoff.ts'
import { companyForVersions, send, versionNumbered } from './test-versions.ts'

function check(hub: Hub, host: string, session: string) {
  return hub.edge.inject({
    method: 'GET',
    url: `/api/app-sessions/current?host=${host}`,
    headers: { [APP_SESSION_HEADER]: session },
  })
}

function routeOf(answer: { json(): unknown }) {
  const { version, database } = Object(answer.json())
  return { version, database }
}

function refused(answer: { statusCode: number; json(): unknown }) {
  return [answer.statusCode, codeOf(answer)]
}

test('chamada na conferência: o Worker c-<projectId> e o login de conferência; a mesma pessoa na Prévia segue na versão e no login do app', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, projectId, owner } = subject
  const version = await versionNumbered(subject, (await send(subject, ana)).number)
  const previa = await sessionOf(hub, ana, PEDIDOS_PREVIA)
  const { session } = await opened(subject, ana)
  const database = { host: new URL(owner.reveal()).hostname, database: 'neondb' }
  const inCheck = await check(hub, PEDIDOS, session)
  assert.equal(inCheck.statusCode, 200, inCheck.body)
  assert.deepEqual(routeOf(inCheck), {
    version: { worker: `c-${projectId}` },
    database: { ...database, login: `app_${projectId}_check_run` },
  })
  assert.deepEqual(routeOf(await check(hub, PEDIDOS_PREVIA, previa)), {
    version: { worker: `v-${version.id}` },
    database: { ...database, login: `app_${projectId}_run` },
  })
})

test('a sessão de conferência recusa depois do fim, depois de 10 minutos, em outro host e para quem foi tirado do Projeto', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, bruno, projects, projectId } = subject
  const SESSION_INVALID = [401, 'APP_SESSION_INVALID']

  const ended = (await opened(subject, ana)).session
  assert.equal((await check(hub, PEDIDOS, ended)).statusCode, 200)
  await hub.apps.confer.end({ session: ended })
  assert.deepEqual(refused(await check(hub, PEDIDOS, ended)), SESSION_INVALID)

  const late = (await opened(subject, ana)).session
  await hub.test.asOwner(
    `update apps.check_session set expires_at = statement_timestamp() - interval '1 second'
      where token_hash = $1`,
    [createHash('sha256').update(late).digest('base64url')],
  )
  assert.deepEqual(refused(await check(hub, PEDIDOS, late)), SESSION_INVALID)

  const elsewhere = (await opened(subject, ana)).session
  assert.deepEqual(refused(await check(hub, PEDIDOS_PREVIA, elsewhere)), SESSION_INVALID)
  assert.equal((await check(hub, PEDIDOS, elsewhere)).statusCode, 200)

  const brunos = (await opened(subject, bruno)).session
  assert.equal((await check(hub, PEDIDOS, brunos)).statusCode, 200)
  const taken = await call(hub, ana, 'DELETE', `${projects}/${projectId}/access/${bruno.id}`)
  assert.equal(taken.statusCode, 204, taken.body)
  assert.deepEqual(refused(await check(hub, PEDIDOS, brunos)), SESSION_INVALID)
  assert.deepEqual(
    await hub.test.asOwner(
      'select count(*)::int as n from apps.check_session where person_id = $1',
      [bruno.id],
    ),
    [{ n: 0 }],
  )
})
