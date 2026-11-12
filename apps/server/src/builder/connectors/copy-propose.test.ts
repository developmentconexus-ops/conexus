import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { BUILDER_TOOL, CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { described } from '../../hub/connectors/test-app-calls.ts'
import { linkSankhya, testOf } from '../../hub/connectors/test-connections.ts'
import { sankhyaServed } from '../../hub/copies/test-released.ts'
import { call } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { conversing, endOf, sent, started, streamOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { COPY_SHAPE_RULE, COPY_TURN_ON_RULE } from './copy-propose.ts'
import { ordersConversing } from './test-orders-turn.ts'

const PROPOSE = BUILDER_TOOL.copyPropose
const SKILL = new URL('../../../../../packages/app/skills/conexus-data/SKILL.md', import.meta.url)

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
      const input = { connections: ['Matriz'], name: 'devolucoes', label: 'Devoluções' }
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

test('a ferramenta onde se copia por consulta', async (t) => {
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
})

test('a ferramenta onde há leitura de lista', async (t) => {
  const on = await ordersConversing(t, () => ({ kind: 'text', text: 'Pronto.' }))
  const before = await on.turn('Quero os pedidos')
  assert.ok(
    before.calls.every((asked) => !asked.tools.includes(PROPOSE)),
    'nothing released',
  )
  await on.release()
  const [first] = (await on.turn('Quero os pedidos')).calls
  assert.ok(first?.tools.includes(PROPOSE), 'offered on a connector that declares a list read')
  const description = first?.descriptions[PROPOSE] ?? ''
  for (const part of [
    'Reads that list rows:',
    '- Connection "Loja A" (mercado-livre):',
    '  - mercado-livre.pedidos (Pedidos): pages by offset, changes by `date_last_updated`',
    '  - mercado-livre.anuncios (Anúncios): pages by cursor, no change filter',
  ])
    assert.ok(description.includes(part), `${part}\n${description}`)
  const granted = await on.hub.connectors.builder.granted({
    companyId: CompanyId.parse(on.companyId),
    projectId: ProjectId.parse(on.projectId),
    personId: PersonId.parse(on.ana.id),
  })
  const reads = granted.flatMap((each) => each.reads)
  assert.deepEqual(reads.find((read) => read.operation === 'pedidos')?.list, {
    paging: 'OFFSET',
    changed: 'date_last_updated',
    ceiling: null,
  })
  assert.deepEqual(reads.find((read) => read.operation === 'anuncios')?.list, {
    paging: 'CURSOR',
    changed: null,
    ceiling: null,
  })
  // A connector copies by its read door or by a list read; the kit's two do, each its own way.
  function row(connector: string) {
    return { id: crypto.randomUUID(), connector, name: 'Loja', notes: {} }
  }
  const marked = described([row('sankhya'), row('mercado-livre')])
  assert.deepEqual(
    marked.map((each) => [each.connector, each.copies]),
    [
      ['sankhya', true],
      ['mercado-livre', true],
    ],
  )
})

test('as seis perguntas', async (t) => {
  const on = await ordersConversing(t, () => ({ kind: 'text', text: 'Pronto.' }))
  await on.release()
  const [first] = (await on.turn('Quero os pedidos')).calls
  const description = first?.descriptions[PROPOSE] ?? ''
  const questions = [
    '1. Keep it or read it live?',
    '2. Does it exist?',
    '3. From which read, with which filter?',
    '4. Which key?',
    '5. Which mode?',
    '6. How often?',
  ]
  const at = questions.map((question) => description.indexOf(question))
  assert.ok(
    at.every((index) => index >= 0),
    description,
  )
  assert.deepEqual(
    at,
    [...at].sort((a, b) => a - b),
    'in order',
  )
  const skill = readFileSync(SKILL, 'utf8')
  for (const part of [
    ...questions,
    'A read with no change filter is a whole copy',
    'unless more than 10% of the rows change at each run',
    'the proof answers the calls a whole pass spends',
    'Say which mode you chose and why',
    COPY_SHAPE_RULE,
    COPY_TURN_ON_RULE,
  ]) {
    assert.ok(description.includes(part), part)
    if (questions.includes(part) || part === COPY_SHAPE_RULE || part === COPY_TURN_ON_RULE)
      assert.ok(skill.includes(part), `conexus-data: ${part}`)
  }
})
