import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CatalogSystem } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { assisting, created, said, talking } from '../../../builder/assistant/test-assistant.ts'
import type { Access, Principal } from '../../../hub/access/public.ts'
import { listing } from '../../../hub/access/test-view.ts'
import { BRUNO, call, codeOf, memberOn, post } from '../../../hub/identity/test-hub.ts'
import { endOf, sessionUrl } from '../../routes/test-conversation.ts'
import type { RunScope } from '../../spec/public.ts'
import { RUN_MARKS } from '../../spec/public.ts'
import { plantMark } from '../../spec/test-run.ts'
import { LOJA, SANKHYA } from '../connectors/test-access.ts'
import type { CompanyToolSeat } from '../public.ts'
import { companyConnections, companyToolScope, companyTools } from '../public.ts'
import {
  FILIAL,
  MATRIZ,
  recorded,
  refusedBy,
  runOf,
  runOn,
  SEATS,
  seatOf,
  textOf,
  VIEW,
} from './test-company-tools.ts'

test('lei (a): nada de fora: nenhuma ferramenta de assento algum nomeia a Filial, `clientes` nem `sankhya_clientes`', async () => {
  for (const seat of SEATS) {
    const { tools, called } = await seatOf(seat)
    for (const name of Object.keys(tools)) {
      assert.doesNotMatch(textOf(tools, name), /Filial|clientes/, `${seat}: ${name}`)
    }
    if ('connector_notes' in tools) {
      assert.ok(refusedBy(await runOn(tools, 'connector_notes', { connection: 'Filial' })), seat)
    }
    if ('connector_read' in tools) {
      const input = { connection: 'Filial', operation: 'sankhya.clientes', input: {} }
      assert.ok(refusedBy(await runOn(tools, 'connector_read', input)), seat)
    }
    const asked = [...called.notes, ...called.reads]
    assert.ok(!asked.includes(LOJA), `${seat}: the door is never asked for the Filial`)
  }
})

test('lei (a): tudo está na vista: cada assento nomeia a Matriz e a lê pela porta', async () => {
  for (const seat of SEATS) {
    const { tools, called } = await seatOf(seat)
    const named = Object.keys(tools).filter((name) => name.startsWith('connector_'))
    assert.ok(named.length > 0, seat)
    for (const name of named) assert.match(textOf(tools, name), /Matriz/, `${seat}: ${name}`)
    if ('connector_notes' in tools) {
      assert.deepEqual(await runOn(tools, 'connector_notes', { connection: 'Matriz' }), {}, seat)
      assert.deepEqual(called.notes, [SANKHYA], seat)
    }
  }
})

test('sem operação no alcance: a Filial recebida não dá skill, linha nem nome, por assento', async () => {
  for (const seat of SEATS) {
    const { scope } = await seatOf(seat)
    const listed = await companyConnections(scope)
    assert.deepEqual(
      listed.map((each) => [each.name, each.skill.name, each.reads.map((read) => read.operation)]),
      [['Matriz', 'conexus-sankhya', ['consultar']]],
      seat,
    )
  }
})

test('pela closure: um requestContext com a marca de outra empresa não muda a resposta', async () => {
  const run = runOf('assistant')
  const { tools, called } = await seatOf('assistant', run)
  const elsewhere = new RequestContext()
  elsewhere.set(RUN_MARKS.assistant.company, randomUUID().replaceAll('-', ''))
  assert.deepEqual(await runOn(tools, 'connector_notes', { connection: 'Matriz' }, elsewhere), {})
  assert.deepEqual(called.runs, [run])
  const overview = await runOn(tools, 'conexus_overview', {}, elsewhere)
  assert.deepEqual(
    overview.connections.map((each: { name: string }) => each.name),
    ['Matriz'],
  )
})

test('a anotação recusa a Filial como a inexistente, sem gravar', async () => {
  const { tools, called } = await seatOf('builder')
  const note = { concept: 'c', mapping: 'm', provingQuery: 'select 1' }
  for (const connection of ['Filial', 'Inexistente']) {
    const saving = await runOn(tools, 'connector_note_save', { connection, ...note })
    assert.ok(refusedBy(saving), `${connection}: ${JSON.stringify(saving)}`)
  }
  assert.deepEqual(called.saved, [])
})

test('sem copy_propose: nenhum assento nomeia a ferramenta, e o nome não roda', async () => {
  for (const seat of SEATS) {
    const { tools } = await seatOf(seat)
    assert.ok(!('copy_propose' in tools), seat)
  }
  const { tools } = await seatOf('builder')
  assert.throws(() => runOn(tools, 'copy_propose', { connections: 'Matriz' }), TypeError)
})

test('uma vez por execução: uma vista por escopo, duas no Assistente com escolha; as conexões uma vez', async () => {
  const cases: readonly [CompanyToolSeat, RunScope['choice'], number][] = [
    ['assistant', { kind: 'CHOSEN', connections: [SANKHYA] }, 2],
    ['assistant', { kind: 'ANY' }, 1],
    ['builder', { kind: 'ANY' }, 1],
  ]
  for (const [seat, choice, views] of cases) {
    const asked: Principal[] = []
    const access: Pick<Access, 'viewOf'> = {
      viewOf: async (principal) => {
        asked.push(principal)
        return VIEW
      },
    }
    let read = 0
    const scope = await companyToolScope(
      runOf(seat, choice),
      {
        access,
        connections: async () => {
          read += 1
          return [MATRIZ, FILIAL]
        },
      },
      { noteSave: false, appData: { kind: 'NONE' } },
    )
    await companyTools(scope, seat, recorded().deps)
    await companyConnections(scope)
    assert.deepEqual([asked.length, read], [views, 1], `${seat} ${choice.kind}`)
  }
})

test('marca de outra empresa: a thread não monta ferramenta da empresa nem chega à porta', async (t) => {
  const on = await assisting(t, [[said('Oi.')]])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  await plantMark(on.hub, String(url.split('/').at(-1)), {
    [RUN_MARKS.assistant.company]: randomUUID().replaceAll('-', ''),
  })
  const sent = await post(on.hub, on.ana, `${sessionUrl(url)}/messages`, { message: 'Oi' })
  assert.deepEqual([sent.statusCode, codeOf(sent)], [404, 'CONVERSATION_NOT_FOUND'])
  assert.deepEqual([on.calls.length, on.reads.length], [0, 0])
})

test('a linha de conexões e as ferramentas do Assistente seguem a vista: a escolhida que o papel perdeu some', async (t) => {
  const on = await assisting(t, [[said('Oi.')]])
  const role = { label: 'Atendente', connectors: { sankhya: ['pedidos'] } }
  const made = await post(on.hub, on.ana, `${on.company}/roles`, role)
  assert.equal(made.statusCode, 201, made.body)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'atendente')
  const url = await created(on.hub, bruno, on.assistant, { connections: [on.matriz] })
  const emptied = await call(on.hub, on.ana, 'PUT', `${on.company}/roles/atendente`, {
    connectors: {},
  })
  assert.equal(emptied.statusCode, 200, emptied.body)
  assert.equal(endOf(await (await talking(t, on.hub, bruno, url)).say('Oi')), 'complete')
  const [asked] = on.calls
  assert.ok(asked)
  assert.doesNotMatch(asked.system, /Matriz/)
  for (const name of asked.tools.filter((each) => each.startsWith('connector_'))) {
    assert.doesNotMatch(JSON.stringify(asked.declared[name]), /Matriz/, name)
  }
})

test('o caderno do agente salvo nomeia a seleção da versão em que o papel de quem roda tem consultar; a linha de conexões, a vista', async () => {
  const run = runOf('agents', { kind: 'CHOSEN', connections: [SANKHYA, LOJA] })
  const { tools, scope, called } = await seatOf('agents', run, [LOJA])
  assert.match(textOf(tools, 'connector_notes'), /Filial/)
  assert.doesNotMatch(textOf(tools, 'connector_notes'), /Matriz/)
  assert.deepEqual(await runOn(tools, 'connector_notes', { connection: 'Filial' }), {})
  assert.ok(refusedBy(await runOn(tools, 'connector_notes', { connection: 'Matriz' })))
  assert.deepEqual(called.notes, [LOJA])
  assert.deepEqual(
    (await companyConnections(scope)).map((each) => each.name),
    ['Matriz'],
  )
})

test('a rodada que ninguém acompanha não leva connector_note_save, mesmo com a anotação concedida', async () => {
  for (const attended of [true, false]) {
    const { tools } = await seatOf('builder', { ...runOf('builder'), attended })
    assert.equal('connector_note_save' in tools, attended, `attended: ${attended}`)
  }
})

test('o resumo lista o alcance do lugar com chosen pela escolha; as ferramentas, só a vista', async () => {
  const filial = CatalogSystem.parse({
    connection: LOJA,
    connector: 'sankhya',
    name: 'Filial',
    reads: [{ operation: 'clientes', label: 'Clientes', summary: 'clientes' }],
    actions: [],
  })
  const reach = listing([...VIEW.list('system'), filial])
  const access: Pick<Access, 'viewOf'> = {
    viewOf: async (principal) => (principal.choice.kind === 'CHOSEN' ? VIEW : reach),
  }
  const scope = await companyToolScope(
    runOf('assistant', { kind: 'CHOSEN', connections: [SANKHYA] }),
    { access, connections: async () => [MATRIZ, FILIAL] },
    { noteSave: false, appData: { kind: 'NONE' } },
  )
  const tools = await companyTools(scope, 'assistant', recorded().deps)
  const overview = await runOn(tools, 'conexus_overview', {})
  assert.deepEqual(
    overview.connections.map((each: { name: string; chosen: boolean }) => [each.name, each.chosen]),
    [
      ['Matriz', true],
      ['Filial', false],
    ],
  )
  assert.doesNotMatch(textOf(tools, 'connector_notes'), /Filial/)
})
