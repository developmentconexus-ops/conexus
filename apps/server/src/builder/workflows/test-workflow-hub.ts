import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { Balloon, WorkflowDraft, WorkflowView } from '@conexus/hub-api'
import { ConnectionId } from '@conexus/hub-api'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import { agentsOn } from '../agents/test-agents.ts'

/** The Assistant's test company, with its workflows' address: Matriz released to the Projeto, Filial not. */
export async function workflowsOn(t: TestContext) {
  const on = await agentsOn(t)
  return {
    ...on,
    base: `${on.company}/workflows`,
    matrizId: ConnectionId.parse(on.matriz),
    filialId: ConnectionId.parse(on.filial),
  }
}

export function draftOf(balloons: Balloon[], name = 'Fluxo'): WorkflowDraft {
  return { name, trigger: { kind: 'MANUAL' }, balloons }
}

export function viewOf(response: { json(): unknown }): WorkflowView {
  return Object(response.json()).workflow
}

/** A new workflow of `person`, made by `place`'s draft. */
export async function madeWorkflow(
  hub: Hub,
  person: Person,
  base: string,
  draft: WorkflowDraft,
  place: object = { kind: 'COMPANY' },
) {
  const made = await post(hub, person, base, { place, draft }, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  return viewOf(made)
}

/** The draft saved at the workflow's revision; the response, whatever it says. */
export function saved(
  hub: Hub,
  person: Person,
  base: string,
  view: WorkflowView,
  draft: WorkflowDraft,
) {
  return call(hub, person, 'PUT', `${base}/${view.id}/draft`, { revision: view.revision, draft })
}
