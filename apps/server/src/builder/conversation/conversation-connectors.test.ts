import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf, messagesOf, sent } from '../../harness/routes/test-conversation.ts'
import { answerTo, ask, tool, untilCard, WHO } from '../../harness/routes/test-questions.ts'
import { PLANTED } from '../../hub/connectors/test-rows.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import type { Block } from './test-connecting.ts'
import { COUNT, connecting, NOTES, READ, SAVE } from './test-connecting.ts'

/** How Mastra lists a skill the model may load. */
const SKILL = '<name>conexus-sankhya</name>'

function reading(sql = COUNT): Block {
  return tool(READ, { connection: 'Matriz', operation: 'sankhya.consultar', input: { sql } })
}

function connectorTools(call: Sent | undefined): string[] {
  return (call?.tools ?? []).filter((name) => name.startsWith('connector_')).sort()
}

const ALL = [NOTES, SAVE, READ].sort()

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
  assert.ok(during?.system.includes('Notebook: nothing yet.'))
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

test('o caderno: sem consulta é recusado; com consulta guarda o mapa e a consulta, nunca uma linha; a consulta recusada recusa a anotação', async (t) => {
  function save(extra: object) {
    return tool(SAVE, {
      ...{ connection: 'Matriz', concept: 'Empresa', mapping: 'TSIEMP.CODEMP' },
      ...extra,
    })
  }
  const on = await connecting(t, [
    [save({})],
    [save({ provingQuery: 'DELETE FROM TSIEMP' })],
    [save({ provingQuery: COUNT })],
  ])
  await on.release(await on.link())
  assert.equal(endOf(await on.sayAnswering([true, true])), 'complete')
  const saves = (await messagesOf(on.hub, on.ana, on.url))
    .flatMap((message) => message.parts)
    .flatMap((part) =>
      part.type === 'tool-invocation' && part.toolInvocation.toolName === SAVE
        ? [part.toolInvocation]
        : [],
    )
  assert.equal(saves.length, 3)
  assert.match(JSON.stringify(saves[0]?.result), /provingQuery/)
  assert.notEqual(Object(saves[1]?.result).kind, 'SAVED')
  assert.equal(Object(saves[2]?.result).kind, 'SAVED')
  const [row] = await on.hub.test.asOwner('select notes from connectors.connection')
  const notes = Object(Object(row).notes)
  assert.deepEqual(Object.keys(notes), ['Empresa'])
  assert.deepEqual(Object.keys(notes.Empresa).sort(), [
    'approvedBy',
    'mapping',
    'provedAt',
    'provedRows',
    'provingQuery',
    'writtenBy',
  ])
  assert.ok(!JSON.stringify(notes).includes('Empresa 0'))
})

test('quem aprova: o sim de quem deixou de gerenciar ligações entre o pedido e o sim é NOT_GRANTED no Builder também, e nada é gravado', async (t) => {
  const on = await connecting(t, [
    [
      tool(SAVE, {
        connection: 'Matriz',
        concept: 'Empresa',
        mapping: 'TSIEMP.CODEMP',
        provingQuery: COUNT,
      }),
    ],
  ])
  await on.release(await on.link())
  assert.equal((await sent(on.hub, on.ana, on.url, 'Anote a empresa')).statusCode, 200)
  const { card } = await untilCard(on.stream, 'note')
  await on.hub.test.asOwner(`update auth.member set role = 'member' where user_id = $1`, [
    on.ana.id,
  ])
  await answerTo(on.hub, on.ana, on.url, card.toolCallId, { kind: 'note', approved: true })
  assert.equal(endOf(await on.stream.turn()), 'complete')
  const [row] = await on.hub.test.asOwner('select notes from connectors.connection')
  assert.deepEqual(Object.keys(Object(Object(row).notes)), [])
  const refused = on.hub.lines.filter((line) => line.message === 'CONNECTION_NOTE_REFUSED')
  assert.equal(refused.length, 1)
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

test('o Builder diz o teto como os outros: a descrição do connector_read conta 50 chamadas por resposta', async (t) => {
  const on = await connecting(t, [])
  await on.release(await on.link())
  assert.equal(endOf(await on.say()), 'complete')
  const described = on.calls.at(0)?.descriptions[READ] ?? ''
  assert.ok(described.includes('At most 50 connector calls per answer.'), described)
  assert.doesNotMatch(described, /per run/)
})
