import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { BUILDER_TOOL } from '@conexus/hub-api'
import { described } from '../../hub/connectors/test-app-calls.ts'
import { linkSankhya, testOf } from '../../hub/connectors/test-connections.ts'
import { sankhyaServed } from '../../hub/copies/test-released.ts'
import { call } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { conversing, endOf, sent, started, streamOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'

const PROPOSE = BUILDER_TOOL.copyPropose

/** A conversation whose model proposes the copy `devolucoes` from the double's sales query, once. */
async function proposing(t: TestContext) {
  const calls: Sent[] = []
  const served = await sankhyaServed(t)
  const definitionOf: { current: unknown } = { current: undefined }
  const on = await conversing(
    t,
    // The model proposes when the tool is offered, once a turn, then answers.
    (asked) => {
      if (!asked.stream) return { kind: 'text', text: 'Título' }
      calls.push(asked)
      if (!asked.tools.includes(PROPOSE) || asked.toolResults.length > 0)
        return { kind: 'text', text: 'Pronto.' }
      const input = { connection: 'Matriz', name: 'devolucoes', label: 'Devoluções' }
      return {
        kind: 'blocks',
        blocks: [tool(PROPOSE, { ...input, definition: definitionOf.current })],
      }
    },
    served.change,
  )
  const vendas = on.hub.connectors.copies.catalog().find((each) => each.model.id === 'vendas')
  assert.ok(vendas)
  definitionOf.current = vendas.model.definition
  const connections = `/api/companies/${on.companyId}/connections`
  const linked = await linkSankhya(on.hub, on.ana, connections, served.fake.credential)
  const connectionId = String(Object(linked.json()).connection.id)
  await testOf(on.hub, on.ana, connections, connectionId)
  async function release() {
    const url = `/api/companies/${on.companyId}/projects/${on.projectId}/connections/${connectionId}`
    assert.equal((await call(on.hub, on.ana, 'PUT', url)).statusCode, 200)
  }
  async function turn() {
    const before = calls.length
    const url = `${on.conversations}/${await started(on.hub, on.ana, on.conversations)}`
    const stream = await streamOf(on.hub, on.ana, url)
    const events = stream.turn()
    assert.equal((await sent(on.hub, on.ana, url, 'Falta devoluções')).statusCode, 200)
    assert.equal(endOf(await events), 'complete')
    await stream.close()
    return calls.slice(before)
  }
  return { ...on, release, turn }
}

test('a ferramenta só onde se copia', async (t) => {
  const on = await proposing(t)
  // No connection released to the Projeto: no connector tool, `copy_propose` neither.
  const [unreleased] = await on.turn()
  assert.ok(unreleased && !unreleased.tools.includes(PROPOSE))
  await on.release()
  const [first, second] = await on.turn()
  assert.ok(first?.tools.includes(PROPOSE), 'offered on a connection whose connector copies')
  const result = second?.toolResults[0]
  assert.ok(result && !result.error, JSON.stringify(result))
  assert.match(result.text, /"kind":"PROPOSED"/)
  assert.match(result.text, /"rows":\d+/)
  // Only a connector that copies through its read door marks its connection: Mercado Livre does not.
  function row(connector: string) {
    return { id: crypto.randomUUID(), connector, name: 'Loja', notes: {} }
  }
  const marked = described([row('sankhya'), row('mercado-livre')])
  assert.deepEqual(
    marked.map((each) => [each.connector, each.copies]),
    [
      ['sankhya', true],
      ['mercado-livre', false],
    ],
  )
})

test('a regra do modo', async (t) => {
  const on = await proposing(t)
  await on.release()
  const [first] = await on.turn()
  const description = first?.descriptions[PROPOSE] ?? ''
  for (const part of [
    'a whole copy (the definition without `changedSince`) when more than 10% of the rows change at each run',
    'Measure the fraction with `connector_read`: count the rows whose change date falls within one interval of the copy against the total',
    'With no column of the change date, the copy is whole',
    'Say which mode you chose and why',
    'The proposal appears in this conversation and on the Cópias page, and whoever may turn copies on turns it on there',
  ])
    assert.ok(description.includes(part), part)
})
