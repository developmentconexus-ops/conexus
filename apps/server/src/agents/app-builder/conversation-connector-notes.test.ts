import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf, messagesOf } from '../../harness/routes/test-conversation.ts'
import { tool } from '../../harness/routes/test-questions.ts'
import { COUNT, connecting, NOTES, READ, SAVE } from './test-connecting.ts'

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
  assert.equal(endOf(await on.sayAnswering([true])), 'complete')
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
  assert.equal(endOf(await on.sayAnswering([true])), 'complete')
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
