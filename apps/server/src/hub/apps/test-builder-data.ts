import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import type { Person } from '../identity/test-hub.ts'
import { companyForVersions, folder, MIGRATION, send } from './test-versions.ts'

/**
 * A Projeto whose app holds `migrations` (after the Recados one) on its company's database, and the
 * Builder's door to its data, `builderData`, as `createApps` makes it (T5): who may use it is read
 * from the Hub on each call, so `ids` names the person each call is made as.
 */
export async function builderDataOn(
  t: TestContext,
  ...migrations: { id: string; statements: string[] }[]
) {
  const on = await companyForVersions(t)
  const sent = await send(on, on.ana, folder({ migrations: [MIGRATION, ...migrations] }))
  assert.equal(sent.preview?.state, 'ready')
  const companyId = CompanyId.parse(on.companyId)
  const projectId = ProjectId.parse(on.projectId)
  function ids(person: Person) {
    return { companyId, projectId, personId: PersonId.parse(person.id) }
  }
  return { ...on, data: on.hub.apps.builderData, ids }
}
