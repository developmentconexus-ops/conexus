import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { companyForVersions, folder, send, versionNumbered } from '../apps/test-versions.ts'
import type { Person } from '../identity/test-hub.ts'
import { call, post } from '../identity/test-hub.ts'

// The Projeto says which version of its app is on the air (step 14.1, criterion 14).

test('appVersion: null antes do primeiro app, o número da versão no ar depois, para dono e membro (14)', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, bruno, projects, projectId } = subject
  async function appVersionFor(person: Person) {
    const read = await call(hub, person, 'GET', `${projects}/${projectId}`)
    assert.equal(read.statusCode, 200)
    return Object(read.json()).project.appVersion
  }
  assert.deepEqual([await appVersionFor(ana), await appVersionFor(bruno)], [null, null])
  assert.equal((await send(subject, ana)).preview?.state, 'ready')
  assert.equal((await send(subject, ana, folder({}, '#6b2fa3'))).preview?.state, 'ready')
  assert.deepEqual([await appVersionFor(ana), await appVersionFor(bruno)], [2, 2])
  const first = await versionNumbered(subject, 1)
  const back = await call(hub, ana, 'PUT', `${projects}/${projectId}/live-version`, {
    versionId: first.id,
  })
  assert.equal(back.statusCode, 200, back.body)
  assert.deepEqual([await appVersionFor(ana), await appVersionFor(bruno)], [1, 1])
})

test('appVersion na criação repetida: a mesma chave devolve o Projeto com a versão no ar do app dele (14)', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, projects } = subject
  const key = randomUUID()
  const made = await post(hub, ana, projects, { name: 'Recados' }, key)
  assert.equal(made.statusCode, 201, made.body)
  const { id, appVersion } = Object(made.json()).project
  assert.equal(appVersion, null)
  assert.equal((await send(subject, ana, folder(), { projectId: id })).preview?.state, 'ready')
  const again = await post(hub, ana, projects, { name: 'Recados' }, key)
  assert.deepEqual(
    [Object(again.json()).project.id, Object(again.json()).project.appVersion],
    [id, 1],
  )
})
