import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TEST_APPS_DOMAIN } from '../../platform/test-database.ts'
import { ANA_OWNER, call, hubWithMail, personOn, plantCompany, post } from '../identity/test-hub.ts'

test('o endereço da Prévia ao lado do endereço; null sem endereço e com um rótulo sem lugar para a marca', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa A', 'empresa-a')
  const projects = `/api/companies/${companyId}/projects`
  const made = await post(hub, ana, projects, { name: 'Estoque' })
  const project = `${projects}/${Object(made.json()).project.id}`
  async function addresses() {
    const read = await call(hub, ana, 'GET', project)
    const { address, previewAddress } = Object(read.json()).project
    return { address, previewAddress }
  }
  assert.deepEqual(await addresses(), {
    address: `estoque--empresa-a.${TEST_APPS_DOMAIN}`,
    previewAddress: `estoque--empresa-a--previa.${TEST_APPS_DOMAIN}`,
  })
  // A label of 56 to 63 characters, which the code before this step took: no room for the mark.
  const long = `${'x'.repeat(45)}--empresa-a`
  await hub.test.asOwner(`update projects.project set host_label = $1`, [long])
  assert.deepEqual(await addresses(), {
    address: `${long}.${TEST_APPS_DOMAIN}`,
    previewAddress: null,
  })
  await hub.test.asOwner(`update projects.project set host_label = null`)
  assert.deepEqual(await addresses(), { address: null, previewAddress: null })
})
