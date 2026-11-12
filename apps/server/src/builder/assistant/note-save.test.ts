import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BRUNO, CARLA, call, memberOn } from '../../hub/identity/test-hub.ts'
import {
  automating,
  created as automationCreated,
  ended,
  ranNow,
} from '../automations/test-automations.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, COUNT, created, said, talking } from './test-assistant.ts'

const SAVE = 'connector_note_save'

test('a anotação grava: a dona pede, a consulta prova uma vez pela porta do Assistente, o modelo ouve SAVED e a ligação mostra a anotação com o nome dela', async (t) => {
  const on = await assisting(t, [
    [
      tool(SAVE, {
        connection: 'Matriz',
        concept: 'Empresa',
        mapping: 'TSIEMP.CODEMP é o código da empresa',
        provingQuery: COUNT,
      }),
    ],
    [said('Anotei: TSIEMP.CODEMP é o código da empresa.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(
    endOf(await say('O CODEMP é o código da empresa; anota isso no caderno')),
    'complete',
  )
  assert.equal(on.calls[0]?.tools.includes(SAVE), true)
  assert.match(on.calls[1]?.texts.at(-1) ?? '', /"kind":"SAVED","provedRows":1/)
  const proved = on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED')
  assert.deepEqual(
    proved.map((line) => [line.fields.by, line.fields.operation]),
    [['assistant', 'consultar']],
  )
  const page = await call(on.hub, on.ana, 'GET', `${on.company}/connections/${on.matriz}`)
  const [note] = Object(page.json()).notes
  assert.equal(note.concept, 'Empresa')
  assert.equal(note.mapping, 'TSIEMP.CODEMP é o código da empresa')
  assert.equal(note.provedRows, 1)
  assert.equal(note.writtenBy, 'Ana Lima')
  const [row] = await on.hub.test.asOwner('select notes from connectors.connection where id = $1', [
    on.matriz,
  ])
  assert.equal(Object(row).notes.Empresa.provingQuery, COUNT)
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
