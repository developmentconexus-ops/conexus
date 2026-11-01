import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { linkSankhya, servedSankhya, testOf } from '../../hub/connectors/test-connections.ts'
import { call } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { PLANTED, withRows } from '../connectors/test-rows.ts'
import { conversing, endOf, messagesOf, sent, started, streamOf } from './test-conversation.ts'
import { answerTo, ask, stepping, tool, untilCard, WHO } from './test-questions.ts'

const READ = 'connector_read'
const NOTES = 'connector_notes'
const SAVE = 'connector_note_save'
/** How Mastra lists a skill the model may load. */
const SKILL = '<name>conexus-sankhya</name>'
const COUNT = 'SELECT COUNT(*) AS N FROM TSIEMP'

type Block = ReturnType<typeof tool>

function reading(sql = COUNT): Block {
  return tool(READ, { connection: 'Matriz', operation: 'sankhya.consultar', input: { sql } })
}

/** A conversation whose Projeto may read the company's Sankhya double (`rows` rows when it answers a query), and the model's steps. */
async function connecting(t: TestContext, steps: Block[][], rows = 3) {
  const calls: Sent[] = []
  const fake = await servedSankhya(t)
  const origin = await withRows(t, fake.origin, rows)
  const on = await conversing(t, stepping(steps, calls), (config) => ({
    ...config,
    connectorOrigins: new Map([['sankhya', origin]]),
  }))
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
  assert.equal(endOf(await on.say()), 'complete')
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
    'mapping',
    'provedAt',
    'provedRows',
    'provingQuery',
    'writtenBy',
  ])
  assert.ok(!JSON.stringify(notes).includes('Empresa 0'))
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

test('connector_notes devolve as anotações da ligação com a consulta de cada uma', async (t) => {
  const on = await connecting(t, [
    [
      tool(SAVE, {
        connection: 'Matriz',
        concept: 'Empresa',
        mapping: 'TSIEMP.CODEMP',
        provingQuery: COUNT,
      }),
    ],
    [tool(NOTES, { connection: 'Matriz' })],
  ])
  await on.release(await on.link())
  assert.equal(endOf(await on.say()), 'complete')
  assert.equal(endOf(await on.say()), 'complete')
  const listed = (await messagesOf(on.hub, on.ana, on.url))
    .flatMap((message) => message.parts)
    .flatMap((part) =>
      part.type === 'tool-invocation' && part.toolInvocation.toolName === NOTES
        ? [Object(part.toolInvocation.result)]
        : [],
    )
  assert.equal(listed.length, 1)
  assert.equal(listed[0].Empresa.provingQuery, COUNT)
})

/** A tool's answer: its kind, or the refusal of its input by Mastra's check of the tool's schema. */
function answerOf(result: unknown) {
  const answer = Object(result)
  return answer.kind ?? (answer.error === true ? 'TOOL_INPUT_REFUSED' : undefined)
}

test('o bloco das ligações mostra o conceito salvo no turno seguinte; um nome que não é de ligação liberada é recusado pelo esquema da ferramenta', async (t) => {
  const missing = { connection: 'Filial', connector: 'sankhya' }
  const on = await connecting(t, [
    [
      tool(SAVE, {
        connection: 'Matriz',
        concept: 'Empresa',
        mapping: 'TSIEMP.CODEMP',
        provingQuery: COUNT,
      }),
      tool(READ, { connection: 'Filial', operation: 'sankhya.consultar', input: { sql: COUNT } }),
      tool(NOTES, missing),
      tool(SAVE, { ...missing, concept: 'X', mapping: 'm', provingQuery: COUNT }),
    ],
  ])
  await on.release(await on.link())
  assert.equal(endOf(await on.say()), 'complete')
  const refused = (await messagesOf(on.hub, on.ana, on.url))
    .flatMap((message) => message.parts)
    .flatMap((part) =>
      part.type === 'tool-invocation' && part.toolInvocation.toolName !== SAVE
        ? [[part.toolInvocation.toolName, answerOf(part.toolInvocation.result)]]
        : [],
    )
    .filter(([name]) => [READ, NOTES].includes(String(name)))
  assert.deepEqual(refused, [
    [READ, 'TOOL_INPUT_REFUSED'],
    [NOTES, 'TOOL_INPUT_REFUSED'],
  ])
  assert.equal(endOf(await on.say()), 'complete')
  assert.ok(on.calls.at(-1)?.system.includes('Notebook: Empresa.'))
  const saves = (await messagesOf(on.hub, on.ana, on.url))
    .flatMap((message) => message.parts)
    .flatMap((part) =>
      part.type === 'tool-invocation' && part.toolInvocation.toolName === SAVE
        ? [answerOf(part.toolInvocation.result)]
        : [],
    )
  assert.deepEqual(saves, ['SAVED', 'TOOL_INPUT_REFUSED'])
})
