import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf, sent } from '../../harness/routes/test-conversation.ts'
import { answerTo, tool, untilCard } from '../../harness/routes/test-questions.ts'
import { BRUNO, CARLA, call, memberOn } from '../../hub/identity/test-hub.ts'
import {
  automating,
  created as automationCreated,
  ended,
  ranNow,
} from '../automations/test-automations.ts'
import { assisting, COUNT, created, said, talking } from './test-assistant.ts'

const SAVE = 'connector_note_save'
const BIA = { name: 'Bia Souza', email: 'bia@example.test' }

const SAVING = [
  [
    tool(SAVE, {
      connection: 'Matriz',
      concept: 'Empresa',
      mapping: 'TSIEMP.CODEMP é o código da empresa',
      provingQuery: COUNT,
    }),
  ],
  [said('Anotei: TSIEMP.CODEMP é o código da empresa.')],
]

function yes(
  hub: Parameters<typeof answerTo>[0],
  person: Parameters<typeof answerTo>[1],
  url: string,
  toolCallId: string,
  approved: boolean,
) {
  return answerTo(hub, person, url, toolCallId, { kind: 'note', approved })
}

async function notesOf(on: Awaited<ReturnType<typeof assisting>>) {
  const page = await call(on.hub, on.ana, 'GET', `${on.company}/connections/${on.matriz}`)
  return Object(page.json()).notes
}

test('pede o sim: a conversa para no cartão com o conceito, o mapeamento e a consulta, nada é provado nem gravado antes do sim, e o sim grava com o nome de quem aprovou', async (t) => {
  const on = await assisting(t, SAVING)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { stream } = await talking(t, on.hub, on.ana, url)
  await sent(on.hub, on.ana, url, 'O CODEMP é o código da empresa; anota isso no caderno')
  const { card } = await untilCard(stream, 'note')
  assert.deepEqual(Object(card.suspendPayload), {
    connection: 'Matriz',
    concept: 'Empresa',
    mapping: 'TSIEMP.CODEMP é o código da empresa',
    provingQuery: COUNT,
  })
  assert.deepEqual(await notesOf(on), [], 'nothing is written before the yes')
  assert.equal(
    on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED').length,
    0,
    'the proving query does not run before the yes',
  )

  assert.equal((await yes(on.hub, on.ana, url, card.toolCallId, true)).statusCode, 200)
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.match(on.calls.at(-1)?.texts.join('\n') ?? '', /"kind":"SAVED","provedRows":1/)
  const proved = on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED')
  assert.deepEqual(
    proved.map((line) => [line.fields.by, line.fields.operation]),
    [['assistant', 'consultar']],
  )
  const [note] = await notesOf(on)
  assert.equal(note.concept, 'Empresa')
  assert.equal(note.provedRows, 1)
  assert.equal(note.writtenBy, 'Ana Lima')
  assert.deepEqual(note.approval, { kind: 'PERSON', name: 'Ana Lima' })
  const [row] = await on.hub.test.asOwner('select notes from connectors.connection where id = $1', [
    on.matriz,
  ])
  assert.equal(Object(row).notes.Empresa.provingQuery, COUNT)
  assert.equal(Object(row).notes.Empresa.approvedBy, on.ana.id)
  const saved = on.hub.lines.filter((line) => line.message === 'CONNECTION_NOTE_SAVED')
  assert.equal(saved.length, 1)
  assert.equal(saved[0]?.fields.approvedBy, on.ana.id)
})

test('a recusa: o Recusar no cartão não prova nem grava nada, e o modelo ouve a recusa', async (t) => {
  const on = await assisting(t, SAVING)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { stream } = await talking(t, on.hub, on.ana, url)
  await sent(on.hub, on.ana, url, 'Anota que o CODEMP é a empresa')
  const { card } = await untilCard(stream, 'note')
  assert.equal((await yes(on.hub, on.ana, url, card.toolCallId, false)).statusCode, 200)
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.deepEqual(await notesOf(on), [])
  assert.equal(
    on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED').length,
    0,
    'the proving query does not run on a refusal',
  )
})

test('quem aprova: o sim de quem deixou de gerenciar ligações entre o pedido e o sim é NOT_GRANTED e nada é gravado, e uma anotação de antes desta etapa lê a aprovação NONE', async (t) => {
  const on = await assisting(t, SAVING)
  const bia = await memberOn(on.hub, on.companyId, BIA, 'admin')
  const url = await created(on.hub, bia, on.assistant, { connections: [on.matriz] })
  const { stream } = await talking(t, on.hub, bia, url)
  await sent(on.hub, bia, url, 'O CODEMP é o código da empresa; anota isso no caderno')
  const { card } = await untilCard(stream, 'note')
  await on.hub.test.asOwner(`update auth.member set role = 'member' where user_id = $1`, [bia.id])
  assert.equal((await yes(on.hub, bia, url, card.toolCallId, true)).statusCode, 200)
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.match(on.calls.at(-1)?.texts.join('\n') ?? '', /"kind":"NOT_GRANTED"/)
  assert.deepEqual(await notesOf(on), [])
  const refused = on.hub.lines.filter((line) => line.message === 'CONNECTION_NOTE_REFUSED')
  assert.equal(refused.length, 1)

  await on.hub.test.asOwner(`update connectors.connection set notes = $2::jsonb where id = $1`, [
    on.matriz,
    JSON.stringify({
      Antiga: {
        mapping: 'de antes',
        provingQuery: COUNT,
        provedAt: '2026-11-01T10:00:00.000Z',
        provedRows: 1,
        writtenBy: on.ana.id,
      },
    }),
  ])
  const [before] = await notesOf(on)
  assert.equal(before.concept, 'Antiga')
  assert.deepEqual(before.approval, { kind: 'NONE' })
})

test('a rodada de automação: a conversa que a automação abre não leva connector_note_save, a da dona leva', async (t) => {
  const on = await automating(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Oi')), 'complete')
  assert.equal(on.calls.at(-1)?.tools.includes(SAVE), true, 'the owner talking')
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
  for (const each of asked) assert.equal(each.tools.includes(SAVE), false)
})

test('o membro: a execução de quem não administra ligações não leva connector_note_save, a da dona leva, e uma chamada inventada não grava nada', async (t) => {
  const on = await assisting(t)
  const owner = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, owner)).say('Oi')), 'complete')
  assert.equal(on.calls.at(-1)?.tools.includes(SAVE), true, 'owner')
  for (const [role, who] of [
    ['member', BRUNO],
    ['developer', CARLA],
  ] as const) {
    const person = await memberOn(on.hub, on.companyId, who, role)
    const url = await created(on.hub, person, on.assistant, { connections: [on.matriz] })
    const { say } = await talking(t, on.hub, person, url)
    assert.equal(endOf(await say('O CODEMP é o código da empresa; anota isso')), 'complete')
    const tools = on.calls.at(-1)?.tools ?? []
    assert.equal(tools.includes(SAVE), false, role)
    assert.equal(tools.includes('show_file'), true, role)
  }
  const steps: ReturnType<typeof said>[][] = []
  steps.push(
    [
      tool(SAVE, {
        connection: 'Matriz',
        concept: 'Empresa',
        mapping: 'TSIEMP.CODEMP é o código da empresa',
        provingQuery: COUNT,
      }),
    ],
    [said('Peça a um administrador.')],
  )
  const invented = await assisting(t, steps)
  const bruno = await memberOn(invented.hub, invented.companyId, BRUNO, 'member')
  const link = await created(invented.hub, bruno, invented.assistant, {
    connections: [invented.matriz],
  })
  const asking = await talking(t, invented.hub, bruno, link)
  assert.equal(endOf(await asking.say('Anota que o CODEMP é a empresa')), 'complete')
  assert.match(invented.calls.at(1)?.texts.join('\n') ?? '', /not found/i)
  const page = await call(
    invented.hub,
    invented.ana,
    'GET',
    `${invented.company}/connections/${invented.matriz}`,
  )
  assert.deepEqual(Object(page.json()).notes, [])
})
