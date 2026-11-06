import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call } from '../../hub/identity/test-hub.ts'
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
  const asked = on.calls.slice(before).filter((each) => each.tools.includes('connector_read'))
  assert.ok(asked.length > 0)
  for (const each of asked) assert.equal(each.tools.includes(SAVE), false)
})
