import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { linkSankhya, servedSankhya, testOf } from '../../hub/connectors/test-connections.ts'
import { withRows } from '../../hub/connectors/test-rows.ts'
import { call } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { conversing, sent, started, streamOf } from './test-conversation.ts'
import type { tool } from './test-questions.ts'
import { stepped } from './test-questions.ts'

type Block = ReturnType<typeof tool>

/** A conversation whose Projeto may read the company's Sankhya double (`rows` rows when it answers a query; `null` runs each query on the double's sales), and the model's steps. */
export async function connecting(t: TestContext, steps: Block[][], rows: number | null = 3) {
  const calls: Sent[] = []
  const fake = await servedSankhya(t)
  const origin = rows === null ? fake.origin : await withRows(t, fake.origin, rows)
  const on = await conversing(
    t,
    stepped(
      steps.map((blocks) => () => blocks),
      calls,
    ),
    (config) => ({
      ...config,
      connectorOrigins: new Map([['sankhya', origin]]),
    }),
  )
  const { hub, ana, companyId, projectId } = on
  const connections = `/api/companies/${companyId}/connections`
  const grant = `/api/companies/${companyId}/projects/${projectId}/connections`
  async function link(name = 'Matriz') {
    const linked = await linkSankhya(hub, ana, connections, fake.credential, undefined, name)
    const id = String(Object(linked.json()).connection.id)
    assert.equal(Object((await testOf(hub, ana, connections, id)).json()).result, 'WORKING')
    return id
  }
  async function release(id: string) {
    assert.equal((await call(hub, ana, 'PUT', `${grant}/${id}`)).statusCode, 200)
  }
  async function withdraw(id: string) {
    assert.equal((await call(hub, ana, 'DELETE', `${grant}/${id}`)).statusCode, 204)
  }
  const url = `${on.conversations}/${await started(hub, ana, on.conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  async function say(content = 'Veja as empresas') {
    assert.equal((await sent(hub, ana, url, content)).statusCode, 200)
    return stream.turn()
  }
  return { ...on, calls, link, release, withdraw, url, stream, say }
}
