import assert from 'node:assert/strict'
import { test } from 'node:test'
import { companyForVersions, folder, send } from '../apps/test-versions.ts'
import type { Person } from '../identity/test-hub.ts'
import { call } from '../identity/test-hub.ts'

// The Projeto says which version of its app is on the air (step 14.1, criterion 14).

test('appVersion: null antes do primeiro app, o número da versão no ar depois, para dono e membro (14)', async (t) => {
  const { hub, ana, bruno, projects, projectId, versions } = await companyForVersions(t)
  async function appVersionFor(person: Person) {
    const read = await call(hub, person, 'GET', `${projects}/${projectId}`)
    assert.equal(read.statusCode, 200)
    return Object(read.json()).project.appVersion
  }
  assert.deepEqual([await appVersionFor(ana), await appVersionFor(bruno)], [null, null])
  assert.equal((await send(hub, ana, versions)).statusCode, 201)
  assert.equal((await send(hub, ana, versions, folder({}, '#6b2fa3'))).statusCode, 201)
  assert.deepEqual([await appVersionFor(ana), await appVersionFor(bruno)], [2, 2])
  const listed = Object((await call(hub, ana, 'GET', versions)).json()).versions
  const first = listed.find((version: { number: number }) => version.number === 1)
  const back = await call(hub, ana, 'PUT', `${projects}/${projectId}/live-version`, {
    versionId: first.id,
  })
  assert.equal(back.statusCode, 200, back.body)
  assert.deepEqual([await appVersionFor(ana), await appVersionFor(bruno)], [1, 1])
})
