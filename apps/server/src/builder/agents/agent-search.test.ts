import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { assisting, created, READ, said, talking } from '../assistant/test-assistant.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { madeTool, publishedAgent, talkedTo } from './test-agents.ts'
import { approving } from './test-approval.ts'

const Answer = z.object({
  kind: z.string(),
  complete: z.boolean(),
  value: z.object({
    linhas: z.array(z.object({ codigoParceiro: z.number(), nome: z.string().nullable() })),
    temMais: z.boolean(),
  }),
})

test('a ferramenta de busca do agente do Projeto: acha por nome sem acento, pagina com depoisDe através do corte de 20 e recusa o campo que não tem', async (t) => {
  const on = await approving(t, [
    [tool('tool_buscar_parceiros', { nome: 'sao' })],
    [tool('tool_buscar_parceiros', { limite: 50 })],
    [tool('tool_buscar_parceiros', { depoisDe: 308, limite: 50 })],
    [tool('tool_buscar_parceiros', { nome: 'sao', telefone: '1' })],
    [said('Pronto.')],
  ])
  const search = await madeTool(on.hub, on.ana, on.tools, {
    slug: 'buscar_parceiros',
    connectionId: on.matriz,
    operation: 'buscarParceiros',
    description: 'Acha parceiros do Sankhya por nome, documento ou código.',
    bound: {},
    open: ['nome', 'documento', 'codigos', 'depoisDe', 'limite'],
  })
  const reader = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Ache os parceiros que a pessoa pedir.',
    connections: [on.matriz],
    tools: [search.latest.id],
  })
  const { say } = await talking(
    t,
    on.hub,
    on.ana,
    await talkedTo(on.hub, on.ana, on.agents, reader.id),
  )
  assert.equal(endOf(await say('Quem tem São no nome? E me mostre todos.')), 'complete')
  function resultOf(call: number) {
    return on.calls[call]?.toolResults.at(-1)?.text ?? ''
  }
  const byName = Answer.parse(JSON.parse(resultOf(1)))
  assert.deepEqual(
    byName.value.linhas.map((row) => row.nome),
    ['PADARIA SÃO JOSÉ', 'SAO PAULO BEBIDAS LTDA'],
  )
  assert.equal(byName.complete, true)

  // 50 asked: the model reads 20, is told the answer is not whole, and goes on from the last code it saw.
  const first = Answer.parse(JSON.parse(resultOf(2)))
  assert.equal(first.value.linhas.length, 20)
  assert.equal(first.value.temMais, true)
  assert.equal(first.complete, false)
  const next = Answer.parse(JSON.parse(resultOf(3)))
  assert.equal(next.value.linhas[0]?.codigoParceiro, 309)
  assert.equal(first.value.linhas.at(-1)?.codigoParceiro, 308)

  const refused = on.calls[4]?.toolResults.at(-1)
  assert.match(refused?.text ?? '', /Unrecognized key.*telefone/)
})

test('o Assistente busca pelo connector_read: acha o produto sem acento, e o campo que a busca não tem volta recusado com o nome dele', async (t) => {
  function search(input: object) {
    return tool(READ, { connection: 'Matriz', operation: 'sankhya.buscarProdutos', input })
  }
  const on = await assisting(t, [
    [search({ nome: 'pão' })],
    [search({ nome: 'pao', preco: 10 })],
    [said('Pronto.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Qual o código do pão?')), 'complete')
  const found = on.calls[1]?.texts.find((text) => text.includes('"kind":"OK"')) ?? ''
  assert.deepEqual(
    z
      .object({ value: z.object({ linhas: z.array(z.object({ codigoProduto: z.number() })) }) })
      .parse(JSON.parse(found))
      .value.linhas.map((row) => row.codigoProduto),
    [10, 12, 200],
  )
  const refused = on.calls[2]?.toolResults.at(-1)
  assert.match(refused?.text ?? '', /INPUT_INVALID/)
  assert.match(refused?.text ?? '', /Unrecognized key.*preco/)
})
