import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { SessionScope, TurnKey } from '../../hub/connectors/public.ts'
import { linkSankhya, servedSankhya, testOf } from '../../hub/connectors/test-connections.ts'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { conversing, sent, streamOf } from '../conversation/test-conversation.ts'
import { stepping, tool } from '../conversation/test-questions.ts'

type Block = ReturnType<typeof tool>

export const READ = 'connector_read'
export const COUNT = 'SELECT COUNT(*) AS N FROM TSIEMP'

/** A `connector_read` of `connection` with a query. */
export function reading(connection = 'Matriz', sql = COUNT): Block {
  return tool(READ, { connection, operation: 'sankhya.consultar', input: { sql } })
}

/** A text the model answers. */
export function said(text: string): Block {
  return { type: 'text', text }
}

/** One read the company's door received from the Assistant: the scope and the turn it came under. */
export type DoorRead = { scope: SessionScope; turn: TurnKey; connectionId: string }

/**
 * Empresa Teste with Ana its owner and a model account, the Projeto Encomendas, and two Sankhya
 * connections on the kit's double: Matriz, released to the Projeto, and Filial, not. The model
 * answers `steps` in order, then `Pronto.`; every call to it is in `calls`, every read the door
 * receives from the Assistant in `reads`.
 */
export async function assisting(t: TestContext, steps: Block[][] = []) {
  const calls: Sent[] = []
  const fake = await servedSankhya(t)
  const on = await conversing(t, stepping(steps, calls), (config) => ({
    ...config,
    connectorOrigins: new Map([['sankhya', fake.origin]]),
  }))
  const { hub, ana, companyId, projectId } = on
  const company = `/api/companies/${companyId}`
  async function link(name: string) {
    const linked = await linkSankhya(
      hub,
      ana,
      `${company}/connections`,
      fake.credential,
      undefined,
      name,
    )
    assert.equal(linked.statusCode, 201, linked.body)
    const id = String(Object(linked.json()).connection.id)
    assert.equal(
      Object((await testOf(hub, ana, `${company}/connections`, id)).json()).result,
      'WORKING',
    )
    return id
  }
  const matriz = await link('Matriz')
  const filial = await link('Filial')
  const released = await call(
    hub,
    ana,
    'PUT',
    `${company}/projects/${projectId}/connections/${matriz}`,
  )
  assert.equal(released.statusCode, 200, released.body)

  const reads: DoorRead[] = []
  const door = hub.connectors.assistant
  const readBy = door.read.bind(door)
  door.read = (scope, a) => {
    reads.push({ scope, turn: a.turn, connectionId: a.connectionId })
    return readBy(scope, a)
  }
  return {
    ...on,
    company,
    assistant: `${company}/assistant/conversations`,
    matriz,
    filial,
    calls,
    reads,
  }
}

/** A new conversation of the Assistant, created by `person` with `body`; its Hub URL. */
export async function created(hub: Hub, person: Person, assistant: string, body: object) {
  const made = await post(hub, person, assistant, body, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  return `${assistant}/${String(Object(made.json()).conversation.id)}`
}

/** The conversation's stream, open until the test ends, and a question that returns its turn's events. */
export async function talking(t: TestContext, hub: Hub, person: Person, url: string) {
  const stream = await streamOf(hub, person, url)
  t.after(() => stream.close())
  async function say(content: string) {
    const asked = await sent(hub, person, url, content)
    assert.equal(asked.statusCode, 200, asked.body)
    return stream.turn()
  }
  return { stream, say }
}
