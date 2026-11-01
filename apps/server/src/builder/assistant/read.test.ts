import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import { TurnKey } from '../../hub/connectors/public.ts'
import { linkSankhya, servedSankhya, testOf } from '../../hub/connectors/test-connections.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, COUNT, created, READ, said, talking } from './test-assistant.ts'

function ownerOf(on: { companyId: string; ana: { id: string } }) {
  return { companyId: CompanyId.parse(on.companyId), personId: PersonId.parse(on.ana.id) }
}

function read(connection: string, input: Record<string, unknown>) {
  return tool(READ, { connection, operation: 'sankhya.consultar', input })
}

test('a leitura pelo nome: com a ligação "Sankhya", o id do conector como nome é recusado pelo esquema da ferramenta, que diz os nomes; uma entrada errada volta com o campo que falta; e a certa lê (ao vivo L2)', async (t) => {
  const fake = await servedSankhya(t)
  const on = await assisting(t, [
    [read('sankhya', { sql: COUNT })],
    [read('Sankhya', { pagina: 0 })],
    [read('Sankhya', { sql: COUNT })],
    [said('Li.')],
  ])
  const linked = await linkSankhya(
    on.hub,
    on.ana,
    `${on.company}/connections`,
    fake.credential,
    undefined,
    'Sankhya',
  )
  assert.equal(linked.statusCode, 201, linked.body)
  const id = String(Object(linked.json()).connection.id)
  const tested = await testOf(on.hub, on.ana, `${on.company}/connections`, id)
  assert.equal(Object(tested.json()).result, 'WORKING')
  const url = await created(on.hub, on.ana, on.assistant, { connections: [id] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quantas empresas?')), 'complete')

  const named = on.calls[1]?.texts.join('\n') ?? ''
  assert.match(named, /connection: Invalid input: expected \\"Sankhya/, 'it names the one there is')
  const input = on.calls[2]?.texts.at(-1) ?? ''
  assert.match(input, /INPUT_INVALID/)
  assert.match(input, /sql/, 'the refusal says which field the operation needs')
  assert.equal(on.calls[3]?.texts.at(-1)?.includes('"kind":"OK"'), true)
  assert.deepEqual(
    on.reads.map((each) => each.connectionId),
    [id, id],
    'the made-up name never reached the door',
  )
  const refusal = on.lines.find((line) => line.message === 'CONNECTOR_INPUT_REFUSED')
  assert.deepEqual(refusal?.fields, {
    connectionId: id,
    operation: 'consultar',
    by: 'assistant',
    reason: 'INPUT_INVALID',
  })
})

test('a recusa da porta: a ligação que a conversa não escolheu volta NOT_GRANTED e o log diz por quê (ao vivo L2)', async (t) => {
  const on = await assisting(t)
  const answered = await on.hub.connectors.assistant.read(
    { ...ownerOf(on), place: { kind: 'COMPANY' }, chosen: [] },
    {
      connectionId: ConnectionId.parse(on.matriz),
      turn: TurnKey.parse(randomUUID()),
      operation: 'consultar',
      input: { sql: COUNT },
    },
  )
  assert.deepEqual(answered, { kind: 'NOT_GRANTED' })
  const line = on.lines.find((each) => each.message === 'ASSISTANT_READ_REFUSED')
  assert.deepEqual(line?.fields, {
    companyId: on.companyId,
    personId: on.ana.id,
    connectionId: on.matriz,
    reason: 'NOT_CHOSEN',
  })
})
