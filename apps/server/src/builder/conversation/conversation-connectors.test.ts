import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PLANTED } from '../../hub/connectors/test-rows.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { connecting } from './test-connecting.ts'
import { endOf, messagesOf, sent } from './test-conversation.ts'
import { answerTo, ask, tool, untilCard, WHO } from './test-questions.ts'

const READ = 'connector_read'
const PROPOSE = 'concept_propose'
const INVENTORY = 'inventory_search'
/** How Mastra lists a skill the model may load. */
const SKILL = '<name>conexus-sankhya</name>'
const COUNT = 'SELECT COUNT(*) AS N FROM TSIEMP'

type Block = ReturnType<typeof tool>

function reading(sql = COUNT): Block {
  return tool(READ, { connection: 'Matriz', operation: 'sankhya.consultar', input: { sql } })
}

function connectorTools(call: Sent | undefined): string[] {
  return (call?.tools ?? []).filter((name) => [READ, PROPOSE, INVENTORY].includes(name)).sort()
}

const ALL = [READ, PROPOSE, INVENTORY].sort()

test('sem liberação a conversa não tem ferramenta nem skill de conector; liberado, tem as três e a skill; tirar tira no turno seguinte', async (t) => {
  const on = await connecting(t, [])
  const id = await on.link()
  const door = on.hub.connectors.builder
  const grantedBy = door.granted.bind(door)
  let reads = 0
  door.granted = (ids) => {
    reads += 1
    return grantedBy(ids)
  }
  assert.equal(endOf(await on.say()), 'complete')
  const before = on.calls.at(0)
  assert.deepEqual(connectorTools(before), [])
  assert.ok(!before?.system.includes('## Connections'))
  assert.ok(!before?.system.includes(SKILL))

  await on.release(id)
  const readBefore = reads
  assert.equal(endOf(await on.say()), 'complete')
  const during = on.calls.at(1)
  assert.deepEqual(connectorTools(during), ALL)
  assert.ok(during?.system.includes('## Connections'))
  assert.ok(during?.system.includes('`Matriz`: sankhya'))
  assert.ok(during?.system.includes(SKILL))
  assert.ok(during?.system.includes('this Project reads one sankhya connection'))
  assert.ok(!during?.system.includes('Notebook'), 'the old notebook left the prompt')
  assert.equal(
    reads - readBefore,
    1,
    'the grants are read once for the turn, not once per tools, skills and instructions',
  )

  await on.withdraw(id)
  assert.equal(endOf(await on.say()), 'complete')
  const after = on.calls.at(2)
  assert.deepEqual(connectorTools(after), [])
  assert.ok(!after?.system.includes('## Connections'))
  assert.ok(!after?.system.includes(SKILL))
})

test('num turno retomado as ferramentas são resolvidas de novo: tirar a liberação com o cartão aberto tira as três', async (t) => {
  const on = await connecting(t, [[ask(WHO)]])
  const id = await on.link()
  await on.release(id)
  assert.equal((await sent(on.hub, on.ana, on.url, 'Pergunte')).statusCode, 200)
  const { card } = await untilCard(on.stream, 'question')
  assert.deepEqual(connectorTools(on.calls.at(0)), ALL)
  await on.withdraw(id)
  const answered = await answerTo(on.hub, on.ana, on.url, card.toolCallId, {
    kind: 'answers',
    answers: ['Todos (recomendado)'],
  })
  assert.equal(answered.statusCode, 200, answered.body)
  assert.equal(endOf(await on.stream.turn()), 'complete')
  assert.deepEqual(connectorTools(on.calls.at(1)), [])
})

test('o corte: 500 linhas ficam na memória só 20, até 16 KB, com complete falso', async (t) => {
  const on = await connecting(t, [[reading()]], 500)
  await on.release(await on.link())
  const events = await on.say()
  assert.equal(endOf(events), 'complete')
  const read = (await messagesOf(on.hub, on.ana, on.url))
    .flatMap((message) => message.parts)
    .flatMap((part) => (part.type === 'tool-invocation' ? [part.toolInvocation] : []))
    .find((each) => each.toolName === READ)
  assert.equal(read?.state, 'result')
  const result = Object(read.result)
  assert.equal(result.kind, 'OK')
  assert.equal(result.complete, false)
  assert.equal(result.value.linhas.length, 20)
  assert.ok(Buffer.byteLength(JSON.stringify(read.result)) <= 16 * 1024)
  assert.ok(!JSON.stringify(read.result).includes(PLANTED))
})

test('a 51ª chamada de conector numa execução é recusada', async (t) => {
  const on = await connecting(t, [Array.from({ length: 51 }, () => reading())])
  await on.release(await on.link())
  assert.equal(endOf(await on.say()), 'complete')
  const results = (await messagesOf(on.hub, on.ana, on.url))
    .flatMap((message) => message.parts)
    .flatMap((part) =>
      part.type === 'tool-invocation' && part.toolInvocation.toolName === READ
        ? [Object(part.toolInvocation.result).kind]
        : [],
    )
  assert.equal(results.length, 51)
  assert.equal(results.filter((kind) => kind === 'CALLS_SPENT').length, 1)
  assert.equal(results.filter((kind) => kind === 'OK').length, 50)
})

/** A tool's answer: its kind, or the refusal of its input by Mastra's check of the tool's schema. */
function answerOf(result: unknown) {
  const answer = Object(result)
  return answer.kind ?? (answer.error === true ? 'TOOL_INPUT_REFUSED' : undefined)
}

test('um nome que não é de ligação liberada é recusado pelo esquema da ferramenta, na leitura e na proposta', async (t) => {
  const missing = { connection: 'Filial', connector: 'sankhya' }
  const on = await connecting(t, [
    [
      tool(READ, { connection: 'Filial', operation: 'sankhya.consultar', input: { sql: COUNT } }),
      tool(PROPOSE, {
        ...missing,
        demand: 'o nome',
        items: [{ kind: 'RENAME_LABEL', target: 'empresa', name: 'Empresa' }],
      }),
    ],
  ])
  await on.release(await on.link())
  assert.equal(endOf(await on.say()), 'complete')
  const refused = (await messagesOf(on.hub, on.ana, on.url))
    .flatMap((message) => message.parts)
    .flatMap((part) =>
      part.type === 'tool-invocation'
        ? [[part.toolInvocation.toolName, answerOf(part.toolInvocation.result)]]
        : [],
    )
  assert.deepEqual(refused, [
    [READ, 'TOOL_INPUT_REFUSED'],
    [PROPOSE, 'TOOL_INPUT_REFUSED'],
  ])
  const [proposals] = await on.hub.test.asOwner('select count(*)::int as n from ontology.proposal')
  assert.equal(Object(proposals).n, 0)
})
