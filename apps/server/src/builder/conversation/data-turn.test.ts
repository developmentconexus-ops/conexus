import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { APP_DATA_TOOL } from '@conexus/hub-api'
import { releasing, sankhyaServed } from '../../hub/copies/test-released.ts'
import { memberOn } from '../../hub/identity/test-hub.ts'
import type { Anthropic, Sent } from '../../platform/test-anthropic.ts'
import { SOURCE_RULE } from '../app-data/public.ts'
import { conversing, endOf, sent, started, streamOf } from './test-conversation.ts'
import { tool } from './test-questions.ts'

const SKILL = new URL('../../../../../packages/app/skills/conexus-data/SKILL.md', import.meta.url)

const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
const COLUMN = 'select "CODVEND" from sync.sankhya_vendas'

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
    '`sync.sankhya_vendas`',
    'through `db`',
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
