import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { APP_DATA_TOOL, BUILDER_TOOL, CopyProposed } from '@conexus/hub-api'
import { releasing, sankhyaServed } from '../../hub/copies/test-released.ts'
import { memberOn } from '../../hub/identity/test-hub.ts'
import type { Anthropic, Sent } from '../../platform/test-anthropic.ts'
import { SOURCE_RULE } from '../app-data/public.ts'
import { ordersConversing } from '../connectors/test-orders-turn.ts'
import { conversing, endOf, messagesOf, sent, started, streamOf } from './test-conversation.ts'
import { tool } from './test-questions.ts'

const SKILL = new URL('../../../../../packages/app/skills/conexus-data/SKILL.md', import.meta.url)

const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
const COLUMN = 'select "CODVEND" from sync.vendas'

/** A Projeto of Sankhya's `vendas` copy, run and released, and a model that checks and reads it. */
async function turning(t: Parameters<typeof conversing>[0]) {
  const calls: Sent[] = []
  const served = await sankhyaServed(t)
  // Each turn asks once, then answers: a new conversation asks again.
  const asking: Anthropic['answer'] = (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    calls.push(asked)
    if (asked.toolResults.length > 0) return { kind: 'text', text: 'Pronto.' }
    return {
      kind: 'blocks',
      blocks: [
        tool(APP_DATA_TOOL.check, { sql: COLUMN, values: [] }),
        tool(APP_DATA_TOOL.read, { sql: `${COLUMN} order by 1 limit 3` }),
      ],
    }
  }
  const on = await conversing(t, asking, served.change)
  await releasing(t, on, served, ['vendas'])
  return { ...on, calls }
}

async function turnOf(on: Awaited<ReturnType<typeof turning>>, person: typeof on.ana) {
  const before = on.calls.length
  const url = `${on.conversations}/${await started(on.hub, person, on.conversations)}`
  const stream = await streamOf(on.hub, person, url)
  const turn = stream.turn()
  assert.equal((await sent(on.hub, person, url, 'Quais vendedores vendem?')).statusCode, 200)
  assert.equal(endOf(await turn), 'complete')
  await stream.close()
  return on.calls.slice(before)
}

test('um turno lê e conta as cópias: o dono e o membro, com a coluna escrita como o bloco a mostra', async (t) => {
  const on = await turning(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'member')
  for (const person of [on.ana, carla]) {
    const [first, second] = await turnOf(on, person)
    assert.ok(first && second)
    for (const name of [APP_DATA_TOOL.check, APP_DATA_TOOL.read])
      assert.ok(first.tools.includes(name), `${person.id} is offered ${name}`)
    assert.ok(first.system.includes('"CODVEND" bigint'), 'the column as the block shows it')
    const results = second.toolResults.map((result) => result.text)
    assert.equal(results.length, 2)
    assert.ok(second.toolResults.every((result) => !result.error))
    assert.ok(results.some((text) => text.includes('COUNTED') && text.includes('EXACT')))
    assert.ok(results.some((text) => text.includes('ROWS') && !text.includes('_pass')))
  }
})

test('o app lê a cópia de qualquer conector', async (t) => {
  const on = await turning(t)
  const [first] = await turnOf(on, on.ana)
  assert.ok(first)
  const { system } = first
  for (const part of [
    '## Data',
    '`sync.vendas`',
    'through `db`',
    '`copy_propose`',
    '`connector_read`',
    '`42501`',
    'comes from what people save in the app, from the company copies released to this Project',
  ])
    assert.ok(system.includes(part), part)
  // The same rule in the prompt and in the block, and in `conexus-data`; no connector named as the one with no copy.
  assert.equal(system.split(SOURCE_RULE).length - 1, 2, 'the prompt and the block')
  const skill = readFileSync(SKILL, 'utf8')
  assert.ok(skill.includes(SOURCE_RULE), 'conexus-data')
  for (const text of [system, skill]) assert.doesNotMatch(text, /today, (the )?Mercado Livre/)
  assert.ok(
    system.indexOf('## Connections') === -1 ||
      system.indexOf('## Connections') < system.indexOf('## Data'),
  )
  for (const name of [APP_DATA_TOOL.read, APP_DATA_TOOL.check]) {
    assert.ok(first.descriptions[name]?.length, name)
  }
  assert.ok(first.descriptions[APP_DATA_TOOL.read]?.includes('sync.<name>'))
  assert.ok(first.descriptions[APP_DATA_TOOL.read]?.includes('double quotes'))
})

const PROPOSE = BUILDER_TOOL.copyPropose
const CONNECTION = /^- Connection "(?<name>[^"]+)" \((?<connector>[^)]+)\):$/m
const CHANGING =
  /^ {2}- (?<operation>[\w-]+\.\w+) \([^)]+\): pages by \w+[^,\n]*, changes by `(?<field>[^`]+)`$/m

/** `copy_propose`'s input from its own description alone: the connection, and the read that changes, by name (T28). */
function proposalFrom(description: string) {
  const connection = CONNECTION.exec(description)?.groups
  const read = CHANGING.exec(description)?.groups
  assert.ok(connection?.name && read?.operation && read.field, description)
  return {
    connections: [connection.name],
    name: 'ml_pedidos',
    label: 'Pedidos',
    definition: {
      version: 2,
      source: { kind: 'OPERATION', operation: read.operation, input: {} },
      description: 'Os pedidos da loja',
      columns: [
        { name: 'id', type: 'bigint', path: 'id', description: 'O número do pedido' },
        { name: 'atualizado', type: 'timestamp', path: read.field },
      ],
      key: ['id'],
      changedSince: { column: 'atualizado' },
    },
  }
}

test('o Builder propõe uma cópia de pedidos', async (t) => {
  const on = await ordersConversing(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    const description = asked.descriptions[PROPOSE]
    if (description === undefined || asked.toolResults.length > 0)
      return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: [tool(PROPOSE, proposalFrom(description))] }
  })
  await on.release()
  const { calls, url } = await on.turn('Quero ver os pedidos das lojas')
  const result = calls[1]?.toolResults[0]
  assert.ok(result && !result.error, JSON.stringify(result))
  assert.match(result.text, /"kind":"PROPOSED"/)
  const parts = (await messagesOf(on.hub, on.ana, url)).flatMap((message) => message.parts)
  const invocation = parts.flatMap((part) =>
    part.type === 'tool-invocation' && part.toolInvocation.toolName === PROPOSE
      ? [part.toolInvocation]
      : [],
  )[0]
  assert.ok(invocation?.state === 'result', JSON.stringify(invocation))
  // The card reads the result as `CopyProposed`: the read, the account, the mode and the calls.
  const card = CopyProposed.parse(invocation.result)
  assert.deepEqual(card.source, {
    kind: 'OPERATION',
    operation: 'pedidos',
    label: 'Pedidos',
    input: {},
  })
  assert.deepEqual(card.sources, [{ name: 'Loja A', connector: 'mercado-livre' }])
  assert.deepEqual(card.mode, { kind: 'CHANGES' })
  assert.equal(typeof card.calls, 'number')
})
