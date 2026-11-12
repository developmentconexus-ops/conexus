import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, ConnectionId, PersonId, ProjectId } from '@conexus/hub-api'
import { TurnKey } from '../../hub/connectors/public.ts'
import { BRUNO, memberOn, post } from '../../hub/identity/test-hub.ts'
import { endOf, hubBeside, messagesOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import {
  assisting,
  created,
  READ,
  reading,
  SEARCH,
  said,
  searching,
  talking,
} from './test-assistant.ts'

const PEDIDOS = 'sankhya_pedidos'
const ORDERS = { connection: 'Matriz', codigoEmpresa: 1, page: 0 }

/** The names of the typed reads a call to the model offered. */
function typedIn(tools: readonly string[] | undefined) {
  return (tools ?? []).filter((name) => /^(sankhya|mercado-livre)_/.test(name))
}

/** Each result the conversation keeps for `name`'s calls, by its kind. */
async function kindsOf(on: Awaited<ReturnType<typeof assisting>>, url: string, name: string) {
  return (await messagesOf(on.hub, on.ana, url))
    .flatMap((message) => message.parts)
    .flatMap((part) =>
      part.type === 'tool-invocation' && part.toolInvocation.toolName === name
        ? [Object(part.toolInvocation.result).kind]
        : [],
    )
}

test('a leitura achada sob demanda', async (t) => {
  const on = await assisting(t, [
    [tool(SEARCH, { query: 'pedidos' })],
    [tool(PEDIDOS, ORDERS)],
    [said('Li os pedidos.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quais os pedidos da empresa 1?')), 'complete')

  const [first, second, third] = on.calls
  assert.ok(first?.tools.includes(SEARCH), 'search_tools is offered from the start')
  assert.deepEqual(typedIn(first?.tools), [], 'no read before a search')
  assert.ok(second?.tools.includes(PEDIDOS), String(second?.tools))
  assert.deepEqual(
    typedIn(second?.tools).filter((name) => !name.startsWith('sankhya_')),
    [],
    'only the chosen connector',
  )
  const schema = JSON.stringify(second?.schemas[PEDIDOS])
  for (const field of ['connection', 'codigoEmpresa', 'page', 'dataNegociacaoInicio']) {
    assert.ok(schema.includes(`"${field}"`), `${field} in ${schema}`)
  }
  assert.ok(third?.texts.some((text) => text.includes('"kind":"OK"')))
  assert.deepEqual(
    on.reads.map((each) => each.connectionId),
    [on.matriz],
  )
})

test('a entrada fora do esquema', async (t) => {
  const on = await assisting(t, [
    [searching(PEDIDOS)],
    [tool(PEDIDOS, { ...ORDERS, codigoEmpresa: 'a primeira' })],
    [tool(PEDIDOS, { ...ORDERS, filial: 'Centro' })],
    [said('Não li.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Os pedidos?')), 'complete')

  const wrongType = on.calls[2]?.texts.join('\n') ?? ''
  assert.match(wrongType, /codigoEmpresa/, 'the refusal names the field')
  const unknown = on.calls[3]?.texts.join('\n') ?? ''
  assert.match(unknown, /filial/, 'a field the operation lacks is refused by name')
  assert.deepEqual(on.reads, [], 'neither reached the Hub')
})

test('a leitura fora do papel não existe', async (t) => {
  const on = await assisting(t, [
    [tool(SEARCH, { query: 'sankhya_empresas empresas' })],
    [tool('sankhya_empresas', { connection: 'Matriz', page: 0 })],
    [said('Não posso.')],
  ])
  const role = { label: 'Atendente', connectors: { sankhya: ['pedidos'] } }
  assert.equal((await post(on.hub, on.ana, `${on.company}/roles`, role)).statusCode, 201)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'atendente')
  const url = await created(on.hub, bruno, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  const { say } = await talking(t, on.hub, bruno, url)
  assert.equal(endOf(await say('Quantas empresas?')), 'complete')

  const found = on.calls[1]?.texts.find((text) => text.includes('"results"')) ?? ''
  assert.ok(!found.includes('sankhya_empresas'), found)
  for (const call of on.calls) assert.ok(!call.tools.includes('sankhya_empresas'), 'never loaded')
  assert.match(on.calls[2]?.texts.at(-1) ?? '', /Tool "sankhya_empresas" not found/)
  assert.deepEqual(on.reads, [], 'the made-up call never reached the door')

  const door = await on.hub.connectors.assistant.read(
    {
      companyId: CompanyId.parse(on.companyId),
      personId: PersonId.parse(bruno.id),
      place: { kind: 'PROJECT', projectId: ProjectId.parse(on.projectId) },
      chosen: [ConnectionId.parse(on.matriz)],
    },
    {
      connectionId: ConnectionId.parse(on.matriz),
      turn: TurnKey.parse(randomUUID()),
      operation: 'empresas',
      input: { page: 0 },
    },
  )
  assert.deepEqual(door, { kind: 'NOT_IN_ROLE', role: 'atendente', operation: 'empresas' })
})

test('as 50 contam', async (t) => {
  const on = await assisting(t, [[searching()], Array.from({ length: 51 }, () => reading())])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Conte as empresas 51 vezes.')), 'complete')

  const kinds = await kindsOf(on, url, READ)
  assert.equal(kinds.length, 51)
  assert.equal(kinds.filter((kind) => kind === 'OK').length, 50)
  assert.equal(kinds.filter((kind) => kind === 'CALLS_SPENT').length, 1)
})

test('a carga sobrevive ao reinício', async (t) => {
  const on = await assisting(t, [
    [tool(SEARCH, { query: 'pedidos' })],
    [said('Achei a leitura dos pedidos.')],
    [tool(PEDIDOS, ORDERS)],
    [said('Li.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  assert.equal(
    endOf(await (await talking(t, on.hub, on.ana, url)).say('Ache os pedidos')),
    'complete',
  )
  assert.ok(on.calls.at(-1)?.tools.includes(PEDIDOS))

  const restarted = await hubBeside(t, on.hub)
  const before = on.calls.length
  assert.equal(
    endOf(await (await talking(t, restarted, on.ana, url)).say('E agora leia')),
    'complete',
  )
  const [asked, answered] = on.calls.slice(before)
  assert.ok(asked?.tools.includes(PEDIDOS), 'loaded while the search is in the messages')
  assert.ok(answered?.texts.some((text) => text.includes('"kind":"OK"')))
})
