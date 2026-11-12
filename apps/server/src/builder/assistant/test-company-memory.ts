import assert from 'node:assert/strict'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call, post } from '../../hub/identity/test-hub.ts'

export const OPERATION_1100 = { name: 'Operação 1100', body: 'A 1100 é a venda à vista.' }
export const NOTE = 'Vale desde janeiro de 2026.'

/**
 * The 1100 saved as a proposal's card saves it: `person` taps Salvar on the page, then on a note
 * on it; each answer as the routes give it.
 */
export async function savedThe1100(hub: Hub, person: Person, companyId: string) {
  const created = await post(hub, person, `${memoryAt(companyId)}/pages`, OPERATION_1100)
  assert.equal(created.statusCode, 201, created.body)
  const { page } = Object(created.json())
  const notes = `${memoryAt(companyId)}/pages/${page.pageId}/notes`
  const added = await post(hub, person, notes, { body: NOTE })
  assert.equal(added.statusCode, 201, added.body)
  return { page, note: Object(added.json()).note }
}

/** The company's memory, at its path. */
export function memoryAt(companyId: string) {
  return `/api/companies/${companyId}/assistant/company-memory`
}

/** The company's memory as `person` reads it on the screen. */
export async function memoryOf(hub: Hub, person: Person, companyId: string) {
  const listed = await call(hub, person, 'GET', memoryAt(companyId))
  assert.equal(listed.statusCode, 200, listed.body)
  return Object(listed.json())
}

/** The company's instructions saved by `person` on the screen, against the version it read. */
export async function instructed(hub: Hub, person: Person, companyId: string, body: string) {
  const { instructions } = await memoryOf(hub, person, companyId)
  const saved = await call(
    hub,
    person,
    'PUT',
    `${memoryAt(companyId)}/pages/${instructions.pageId}`,
    {
      ...{ name: instructions.name, body, version: instructions.version },
    },
  )
  assert.equal(saved.statusCode, 200, saved.body)
}
