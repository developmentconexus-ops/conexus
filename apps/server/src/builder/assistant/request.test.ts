import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { endOf } from '../../harness/routes/test-conversation.ts'
import { sameRequests } from '../../harness/spec/test-request.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { ofTurn, plantCodex } from '../../platform/test-openai-codex.ts'
import {
  automating,
  created as automation,
  ended,
  ranNow,
  salesSummary,
} from '../automations/test-automations.ts'
import {
  assisting,
  created,
  helperReading,
  reading,
  researching,
  said,
  searching,
  subscribed,
  talking,
} from './test-assistant.ts'

function snapshot(name: string): string {
  return fileURLToPath(new URL(`./requests/${name}.snapshot`, import.meta.url))
}

/** The turn's calls against the scenario's snapshot in `requests/`. */
function same(t: TestContext, calls: readonly Sent[], name: string) {
  sameRequests(
    t,
    calls.map((each) => each.body),
    snapshot(name),
  )
}

test('uma conversa em Início com uma ligação: a busca, a leitura e a resposta', async (t) => {
  const on = await assisting(t, [[searching()], [reading()], [said('A Matriz tem 2 empresas.')]])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  assert.equal(
    endOf(await (await talking(t, on.hub, on.ana, url)).say('Quantas empresas?')),
    'complete',
  )
  assert.equal(on.calls.length, 3)
  same(t, on.calls, 'inicio-com-ligacao')
})

test('uma conversa num Projeto', async (t) => {
  const on = await assisting(t, [[said('Oi, Ana.')]])
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [],
  })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Oi')), 'complete')
  assert.equal(on.calls.length, 1)
  same(t, on.calls, 'projeto')
})

test('a rodada de uma automação, sem ninguém olhando', async (t) => {
  const on = await automating(t, [[said('O resumo de ontem.')]])
  const made = await automation(on.hub, on.ana, on.automations, salesSummary([on.matriz]))
  const url = `${on.automations}/${made.id}`
  const run = await ended(on.hub, on.ana, url, await ranNow(on.hub, on.ana, url))
  assert.equal(run.state.kind, 'DONE')
  assert.equal(on.calls.length, 1)
  same(t, on.calls, 'automacao')
})

test('o ajudante pesquisar: o pedido, a leitura dele, o resumo e a resposta', async (t) => {
  const on = await assisting(t, [
    [researching()],
    [helperReading()],
    [said('A Matriz tem 2 empresas, pela consulta.')],
    [said('Há 2 empresas.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  assert.equal(
    endOf(await (await talking(t, on.hub, on.ana, url)).say('Quantas empresas?')),
    'complete',
  )
  assert.equal(on.calls.length, 4)
  same(t, on.calls, 'ajudante-pesquisar')
})

test('o modelo Luna pela assinatura do ChatGPT: o corpo que o Codex recebe', async (t) => {
  const codex = plantCodex(t)
  codex.typed = true
  const on = await assisting(t)
  await subscribed(on)
  const url = await created(on.hub, on.ana, on.assistant, {
    connections: [],
    model: 'openai/gpt-6-luna',
    effort: 'low',
  })
  await (await talking(t, on.hub, on.ana, url)).say('Oi')
  const bodies = codex.calls
    .filter((made) => made.endpoint === 'responses' && ofTurn(made.body))
    .map((made): unknown => JSON.parse(made.body))
  assert.ok(bodies.length > 0)
  sameRequests(t, bodies, snapshot('luna'))
})
