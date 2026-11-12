import assert from 'node:assert/strict'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { tool } from '../conversation/test-questions.ts'

type Block = ReturnType<typeof tool>

export const OPERATION_1100 = { name: 'Operação 1100', body: 'A 1100 é a venda à vista.' }
export const NOTE = 'Vale desde janeiro de 2026.'

/** What the model read last, as the tool's result gave it. */
function lastRead(asked: Sent) {
  return Object(JSON.parse(asked.toolResults.at(-1)?.text ?? '{}'))
}

/**
 * The model's steps to save the 1100 in the company (T28: each argument is one it read): it lists
 * the scopes it holds, creates the page in the company's, then adds a note on the page it made.
 */
export function savingThe1100(): ((asked: Sent) => Block[])[] {
  let scope = ''
  return [
    () => [tool('knowledge_read', {})],
    (asked) => {
      scope = String(lastRead(asked).scopes.at(0).address)
      return [tool('knowledge_page', { op: 'write', scope, ...OPERATION_1100 })]
    },
    (asked) => {
      const page = String(lastRead(asked).page.ref)
      return [tool('knowledge_note', { op: 'add', page, scope: [scope], text: NOTE })]
    },
  ]
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
