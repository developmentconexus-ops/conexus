import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { companyForVersions, folder, send } from '../apps/test-versions.ts'
import type { Person } from '../identity/test-hub.ts'
import { call, post } from '../identity/test-hub.ts'

// The Projeto says which version of its app is on the air (step 14.1, criterion 14).

test('o Projeto diz a Prévia e a publicada: null antes do primeiro app, os números depois, para dono e membro (14, 17)', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, bruno, projects, projectId } = subject
  async function appVersionFor(person: Person) {
    const read = await call(hub, person, 'GET', `${projects}/${projectId}`)
    assert.equal(read.statusCode, 200)
    const { appVersion, publishedVersion } = Object(read.json()).project
    return [appVersion, publishedVersion]
  }
  assert.deepEqual(
    [await appVersionFor(ana), await appVersionFor(bruno)],
    [
      [null, null],
      [null, null],
    ],
  )
  assert.equal((await send(subject, ana)).preview?.state, 'ready')
  assert.equal((await send(subject, ana, folder({}, '#6b2fa3'))).preview?.state, 'ready')
  assert.deepEqual(
    [await appVersionFor(ana), await appVersionFor(bruno)],
    [
      [2, null],
      [2, null],
    ],
  )
  const published = await call(hub, bruno, 'PUT', `${projects}/${projectId}/published-version`, {
    number: 1,
  })
  assert.equal(published.statusCode, 200, published.body)
  assert.deepEqual(
    [await appVersionFor(ana), await appVersionFor(bruno)],
    [
      [2, 1],
      [2, 1],
    ],
  )
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
