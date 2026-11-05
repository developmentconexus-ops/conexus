import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  automating,
  created as automationCreated,
  ended,
  ranNow,
} from '../automations/test-automations.ts'
import { endOf, messagesOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

const APP = 'propose_app'
const CHANGE = 'propose_app_change'
const SUMMARY = 'O time de compras registra o que pedir a cada fornecedor, lendo o giro do Sankhya.'
const BRIEFING =
  '# Compras\n\nQuem usa: o time de compras.\n\n## Em aberto\n\n- Quem aprova o pedido?'

function write(path: string, content: string) {
  return tool('mastra_workspace_write_file', { path, content })
}

/** The outputs the model's hand-off calls stored, in order, read again from the conversation's messages. */
async function proposed(on: Awaited<ReturnType<typeof assisting>>, url: string, name: string) {
  const messages = await messagesOf(on.hub, on.ana, url)
  return messages.flatMap((message) =>
    message.parts.flatMap((part) => {
      const call = Object(part).toolInvocation
      return Object(part).type === 'tool-invocation' && call?.toolName === name ? [call.result] : []
    }),
  )
}

test('o briefing lido na chamada: o propose_app guarda o resumo e o briefing inteiro, relido depois do turno; o modelo recebe só o que acontece depois (1)', async (t) => {
  const on = await assisting(t, [
    [write('briefing.md', BRIEFING)],
    [tool(APP, { summary: SUMMARY, briefing: 'briefing.md' })],
    [said('Toque Criar app.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quero um app de compras')), 'complete')

  assert.deepEqual(await proposed(on, url, APP), [
    { summary: SUMMARY, briefing: { name: 'briefing.md', content: BRIEFING } },
  ])
  const next = on.calls.at(2)?.texts.join('\n') ?? ''
  assert.match(next, /"proposed":true/)
  assert.match(next, /Do not propose again/)
  assert.equal(next.includes('Quem aprova'), false, 'the briefing is not carried back to the model')
})

test('as recusas do briefing: inexistente, fora da pasta, que não é texto, ou acima de 64 KB não propõem nada, e o modelo lê a razão (2)', async (t) => {
  const on = await assisting(t, [
    [tool(APP, { summary: SUMMARY, briefing: 'nao-existe.md' })],
    [tool(APP, { summary: SUMMARY, briefing: '../../../etc/hostname' })],
    [write('briefing.csv', 'a;b')],
    [tool(APP, { summary: SUMMARY, briefing: 'briefing.csv' })],
    [
      tool('mastra_workspace_execute_command', {
        command: 'head -c 70000 /dev/zero | tr "\\0" a > grande.md',
      }),
    ],
    [tool(APP, { summary: SUMMARY, briefing: 'grande.md' })],
    [said('Pronto.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quero um app')), 'complete')

  const reasons = ['NOT_FOUND', 'OUTSIDE', 'NOT_TEXT', 'TOO_LARGE']
  assert.deepEqual(
    await proposed(on, url, APP),
    reasons.map((reason) => ({ kind: 'PROPOSE_REFUSED', reason })),
  )
  const read = on.calls.map((each) => each.texts.join('\n')).join('\n')
  for (const reason of reasons) assert.match(read, new RegExp(`"reason":"${reason}"`))
})

test('a entrada que o Mastra recusa: um propose_app sem briefing termina a volta, e o modelo lê a recusa do Mastra para chamar de novo', async (t) => {
  const on = await assisting(t, [
    [tool(APP, { summary: SUMMARY })],
    [said('Vou escrever o briefing.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quero um app')), 'complete')
  assert.match(on.calls.at(-1)?.texts.join('\n') ?? '', /validation failed for propose_app/i)
})

test('a mudança no Projeto: o propose_app_change guarda o resumo e o briefing como o propose_app', async (t) => {
  const on = await assisting(t, [
    [write('mudanca.md', BRIEFING)],
    [tool(CHANGE, { summary: 'Mostrar a cobertura em dias.', briefing: 'mudanca.md' })],
    [said('Toque Mandar ao Builder.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quero que o app mostre a cobertura em dias')), 'complete')

  assert.deepEqual(await proposed(on, url, CHANGE), [
    {
      summary: 'Mostrar a cobertura em dias.',
      briefing: { name: 'mudanca.md', content: BRIEFING },
    },
  ])
  assert.match(on.calls.at(2)?.texts.join('\n') ?? '', /Mandar ao Builder/)
})

test('a rodada de automação: numa conversa que a rodada abriu, no Início ou no Projeto, o modelo não recebe propose_app nem propose_app_change (4)', {
  timeout: 150_000,
}, async (t) => {
  const on = await automating(t)
  for (const place of [{}, { projectId: on.projectId }]) {
    const body = {
      name: 'Relatório',
      prompt: 'O relatório de vendas de ontem.',
      cadence: { kind: 'DAILY', time: '07:00' },
      connections: [on.matriz],
      ...place,
    }
    const automation = await automationCreated(on.hub, on.ana, on.automations, body)
    const url = `${on.automations}/${automation.id}`
    const before = on.calls.length
    const run = await ended(on.hub, on.ana, url, await ranNow(on.hub, on.ana, url))
    assert.equal(run.state.kind, 'DONE')
    const asked = on.calls.slice(before).filter((each) => each.tools.includes('show_file'))
    assert.ok(asked.length > 0)
    for (const each of asked) {
      assert.equal(each.tools.includes(APP), false)
      assert.equal(each.tools.includes(CHANGE), false)
      assert.equal(each.tools.includes('propose_automation'), true)
    }
  }
})
