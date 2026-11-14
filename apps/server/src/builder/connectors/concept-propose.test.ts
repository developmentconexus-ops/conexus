import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ConnectionId, PersonId, ProjectId, ProposedItem, RunId } from '@conexus/hub-api'
import { appCalls } from '../../hub/connectors/test-app-calls.ts'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { BRUNO, memberOn, post } from '../../hub/identity/test-hub.ts'
import { assisting, created, said, talking } from '../assistant/test-assistant.ts'
import {
  automating,
  created as automationCreated,
  ended,
  ranNow,
} from '../automations/test-automations.ts'
import { connecting } from '../conversation/test-connecting.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'

const PROPOSE = 'concept_propose'
const SELLERS = 'SELECT CODVEND FROM TGFVEN'
const Items = ProposedItem.array()

/** A concept read from `sql` whose one field, its key and title, is `column`; and its source. */
function concept(key: string, sql: string, column: string, type = 'ID') {
  return [
    {
      kind: 'ADD_CONCEPT',
      concept: {
        ...{ key, name: key, plural: `${key}s`, description: '', synonyms: [] },
        ...{ keyFields: ['valor'], titleField: 'valor', state: 'EXPERIMENTAL' },
      },
    },
    {
      kind: 'ADD_FIELD',
      concept: key,
      field: { key: 'valor', name: 'Valor', description: '', type, column },
    },
    { kind: 'SET_SOURCE', concept: key, sql },
  ]
}

test('o membro pelo Assistente: Bruno, sem manageConnections, propõe, e a proposta guarda quem propôs e o agente', async (t) => {
  const on = await assisting(t, [
    [
      tool(PROPOSE, {
        connection: 'Matriz',
        demand: 'as empresas',
        items: concept('empresa', SELLERS, 'CODVEND'),
      }),
    ],
    [said('Proposto.')],
  ])
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const url = await created(on.hub, bruno, on.assistant, { connections: [on.matriz] })
  assert.equal(endOf(await (await talking(t, on.hub, bruno, url)).say('As empresas')), 'complete')
  assert.equal(on.calls[0]?.tools.includes(PROPOSE), true)
  assert.match(on.calls[1]?.texts.at(-1) ?? '', /"kind":"PROPOSED"/)
  const proposals = await on.hub.test.asOwner('select proposed_by, agent from ontology.proposal')
  assert.deepEqual(proposals, [{ proposed_by: bruno.id, agent: 'assistant' }])
  const [items] = await on.hub.test.asOwner('select count(*)::int as n from ontology.proposal_item')
  assert.equal(Object(items).n, 3)
})

const ATENDENTE = { label: 'Atendente', connectors: { sankhya: ['pedidos'] } }

/** Empresa A with an active concept `empresa` (revision 1), and Carla, a member, in the company's role "Atendente" or in `member`; her proposals through the Builder's door. */
async function proposerOn(t: TestContext, role: 'atendente' | 'member') {
  const on = await appCalls(t)
  const matriz = ConnectionId.parse(await on.connect('Matriz'))
  const base = `/api/companies/${on.companyId}`
  if (role === 'atendente') {
    assert.equal((await post(on.hub, on.ana, `${base}/roles`, ATENDENTE)).statusCode, 201)
    await on.hub.test.asOwner(
      "update auth.member set role = 'atendente' where company_id = $1 and user_id = $2",
      [on.companyId, on.carla.id],
    )
  }
  const proposal = randomUUID()
  const seeded = [proposal, on.companyId, on.ana.id]
  await on.hub.test.asOwner(
    `insert into ontology.proposal(id, company_id, demand, proposed_by, agent, base_revision,
       created_at, state) values ($1, $2, 'As empresas', $3, 'builder', 0, now(), 'CLOSED')`,
    seeded,
  )
  await on.hub.test.asOwner(
    `insert into ontology.revision(company_id, number, proposal_id, proposed_by, approved_by,
       approved_at, hash) values ($2, 1, $1, $3, $3, now(), repeat('a', 64))`,
    seeded,
  )
  await on.hub.test.asOwner(
    `insert into ontology.concept_version(company_id, key, revision, name, plural, description,
       synonyms, title_field, key_fields, base, state) values ($1, 'empresa', 1, 'Empresa',
       'Empresas', '', '{}', 'valor', '{valor}', null, 'ACTIVE')`,
    [on.companyId],
  )
  const ids = { companyId: CompanyId.parse(on.companyId), projectId: ProjectId.parse(on.projectId) }
  const personId = PersonId.parse(on.carla.id)
  async function propose(items: readonly unknown[]) {
    const door = await on.hub.connectors.builder.concepts(ids, {
      connectionId: matriz,
      personId,
      runId: RunId.parse(randomUUID()),
    })
    assert.ok(door)
    return on.hub.ontology.concepts.propose({
      ...{ companyId: ids.companyId, personId, agent: 'builder', conversationId: null },
      ...{ demand: 'As empresas', items: Items.parse(items), door },
    })
  }
  function called() {
    return on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED').length
  }
  return { ...on, propose, called }
}

const SOURCE = { kind: 'SET_SOURCE', concept: 'empresa', sql: SELLERS }
const RENAME = { kind: 'RENAME_LABEL', target: 'empresa', name: 'Empresa do grupo' }

test('o membro pelo Builder: a porta de conceitos do Projeto prova para quem não administra ligações', async (t) => {
  const on = await proposerOn(t, 'member')
  const proposed = await on.propose([SOURCE])
  assert.deepEqual(proposed.refused, [])
  assert.deepEqual(proposed.items[0]?.proof?.columns, ['CODVEND'])
  assert.ok((proposed.items[0]?.proof?.rows ?? 0) > 0)
  const open = await on.hub.test.asOwner(
    "select proposed_by, agent from ontology.proposal where state = 'OPEN'",
  )
  assert.deepEqual(open, [{ proposed_by: on.carla.id, agent: 'builder' }])
})

test('o papel sem consultar: o RENAME_LABEL fica, o SET_SOURCE volta NOT_IN_ROLE e o dublê não recebe a consulta', async (t) => {
  const on = await proposerOn(t, 'atendente')
  const before = on.called()
  const proposed = await on.propose([RENAME, SOURCE])
  assert.deepEqual(
    proposed.items.map((each) => each.target),
    ['empresa'],
  )
  assert.deepEqual(proposed.refused, [{ target: 'empresa', reason: 'NOT_IN_ROLE' }])
  assert.equal(on.called(), before, 'the proof never reads what the role does not')
  const kinds = await on.hub.test.asOwner('select kind from ontology.proposal_item order by n')
  assert.deepEqual(kinds, [{ kind: 'RENAME_LABEL' }])
})

test('a rodada de automação: a conversa que a automação abre não leva concept_propose, a da dona leva', async (t) => {
  const on = await automating(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Oi')), 'complete')
  assert.equal(on.calls.at(-1)?.tools.includes(PROPOSE), true, 'the owner talking')
  const automation = await automationCreated(on.hub, on.ana, on.automations, {
    name: 'Relatório',
    prompt: 'O relatório de vendas de ontem.',
    cadence: { kind: 'DAILY', time: '07:00' },
    connections: [on.matriz],
  })
  const ran = `${on.automations}/${automation.id}`
  const before = on.calls.length
  const run = await ended(on.hub, on.ana, ran, await ranNow(on.hub, on.ana, ran))
  assert.equal(run.state.kind, 'DONE')
  const asked = on.calls.slice(before).filter((each) => each.tools.includes('search_tools'))
  assert.ok(asked.length > 0)
  for (const each of asked) assert.equal(each.tools.includes(PROPOSE), false)
})

/** The movement type of a note, `key`'s field `valor`, with the code V the double's notes carry, citing `dictionary`. */
function movement(key: string, dictionary: string) {
  return [
    ...concept(key, 'SELECT TIPMOV FROM TGFCAB', 'TIPMOV', 'CODE'),
    { kind: 'SET_CODE', concept: key, field: 'valor', value: 'V', label: 'Venda', dictionary },
  ]
}

/** A finished reading of the connection's dictionary, as the inventory writes one, holding the codes V and P of TGFCAB.TIPMOV. */
async function planted(hub: Hub, companyId: string, connectionId: string) {
  const run = randomUUID()
  const on = [run, companyId, connectionId]
  await hub.test.asOwner(
    'insert into ontology.inventory_run(id, company_id, connection_id, started_at) values ($1, $2, $3, now())',
    on,
  )
  await hub.test.asOwner(
    `insert into ontology.inventory_end(run_id, company_id, ended_at, outcome, reason, pages)
       values ($1, $2, now(), 'COMPLETE', null, 1)`,
    on.slice(0, 2),
  )
  await hub.test.asOwner(
    `insert into ontology.inventory_entry(run_id, company_id, kind, name, type, label, custom)
       values ($1, $2, 'CODE', 'TGFCAB.TIPMOV=V', null, 'Venda', false),
         ($1, $2, 'CODE', 'TGFCAB.TIPMOV=P', null, 'Pedido', false)`,
    on.slice(0, 2),
  )
}

test('a origem do código: a entrada citada fica só quando o inventário a tem e o valor do código é o dela (a entrada de outro valor, que o inventário também tem, não vale)', async (t) => {
  const items = [
    ...movement('lido', 'TGFCAB.TIPMOV=V'),
    ...movement('outro_campo', 'TGFCAB.STATUSNOTA=V'),
    ...movement('outro_valor', 'TGFCAB.TIPMOV=P'),
    ...movement('inventado', 'TGFCAB.AD_NADA=V'),
  ]
  const on = await connecting(
    t,
    [[tool(PROPOSE, { connection: 'Matriz', demand: 'os tipos', items })]],
    null,
  )
  const matriz = await on.link()
  await on.release(matriz)
  await planted(on.hub, on.companyId, matriz)
  assert.equal(endOf(await on.say()), 'complete')
  const codes = await on.hub.test.asOwner(
    "select target, content->>'dictionary' as dictionary from ontology.proposal_item where kind = 'SET_CODE' order by n",
  )
  assert.deepEqual(codes, [
    { target: 'lido.valor=V', dictionary: 'TGFCAB.TIPMOV=V' },
    { target: 'outro_campo.valor=V', dictionary: null },
    { target: 'outro_valor.valor=V', dictionary: null },
    { target: 'inventado.valor=V', dictionary: null },
  ])
})
