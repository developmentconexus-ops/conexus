import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { Reply } from '../../platform/test-anthropic.ts'
import { said } from '../assistant/test-assistant.ts'
import { endOf, hubBeside, sent, stopped, streamOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { madeTool, ordersOf, savedCodeTool } from './test-agents.ts'
import {
  ASKED,
  answer,
  approvalsIn,
  approving,
  askedOf,
  launched,
  PERSON_PACE_MS,
  pendingOf,
  untilAsked,
  WRITE,
} from './test-approval.ts'

// Every other tool of an agent with all of them on, called in one step; the write in the next.
const EVERY_OTHER: Extract<Reply, { kind: 'blocks' }>['blocks'] = [
  tool('tool_pedidos_matriz', { page: 1 }),
  tool('tool_vendas_do_mes', { mes: '2026-10' }),
  tool('connector_notes', {}),
  tool('web_fetch', { url: 'http://127.0.0.1:9/' }),
  { type: 'search', query: 'pedidos', results: [{ url: 'https://example.com', title: 'x' }] },
  tool('show_file', { path: 'nada.md' }),
  tool('execute_typescript', { code: 'return 1' }),
  tool('mastra_workspace_write_file', { path: 'a.md', content: 'x' }),
  tool('mastra_workspace_read_file', { path: 'a.md' }),
  tool('mastra_workspace_edit_file', { path: 'a.md', old_string: 'x', new_string: 'y' }),
  tool('mastra_workspace_list_files', { path: '.' }),
  tool('mastra_workspace_file_stat', { path: 'a.md' }),
  tool('mastra_workspace_mkdir', { path: 'pasta' }),
  tool('mastra_workspace_grep', { pattern: 'y' }),
  tool('mastra_workspace_delete', { path: 'a.md' }),
  tool('mastra_workspace_execute_command', { command: 'echo oi' }),
  tool('mastra_workspace_get_process_output', { pid: '1' }),
  tool('mastra_workspace_kill_process', { pid: '1' }),
]

test('a escrita espera, o resto não: com yolo desligado, cada ferramenta do agente roda sem pedir, e a escrita em Pergunta antes para no cartão sem enviar (5)', async (t) => {
  const on = await approving(t, [[...EVERY_OTHER], [launched()], [said('Lançado.')]])
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const code = await savedCodeTool(on)
  const agent = await on.writer('ASK', { web: true, machine: true }, [
    orders.latest.id,
    code.latest.id,
  ])
  const { url, stream } = await on.opened(agent.id)
  assert.equal((await sent(on.hub, on.ana, url, 'Lance o pedido do cliente 1')).statusCode, 200)
  const events = await untilAsked(stream)

  const offered = new Set(on.calls[0]?.tools)
  const called = new Set(
    EVERY_OTHER.flatMap((each) => {
      if (each.type === 'search') return ['web_search']
      return each.type === 'tool_use' ? [each.name] : []
    }),
  )
  assert.deepEqual(
    [...offered].filter((name) => !called.has(name)),
    [WRITE],
    'the test calls every tool of the run but the write',
  )
  assert.deepEqual(
    approvalsIn(events).map((each) => each.toolName),
    [WRITE],
  )
  const asked = askedOf(events)
  assert.deepEqual(asked.args, ASKED)
  assert.equal(on.calls.length, 2, 'the run stopped at the write, the model not asked again')
  assert.equal(pendingOf(stream)[asked.toolCallId]?.toolName, WRITE)
  assert.deepEqual(on.fake.orders(), [], 'nothing reached the Sankhya')
})

test('aprovar, recusar, mensagem, Parar: Aprovar roda a escrita uma vez e o turno termina; Recusar, uma mensagem nova e Parar não rodam nada, e uma resposta atrasada responde ok: false (6)', async (t) => {
  const on = await approving(t, [
    [launched()],
    [said('Lançado.')],
    [launched()],
    [said('Não lancei.')],
    [launched()],
    [said('Certo, são três.')],
    [launched()],
  ])
  const agent = await on.writer('ASK')
  const { url, stream } = await on.opened(agent.id)

  await sent(on.hub, on.ana, url, 'Lance o pedido')
  const approved = askedOf(await untilAsked(stream)).toolCallId
  assert.deepEqual(await answer(on.hub, on.ana, url, approved, true), { ok: true })
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.equal(on.fake.orders().length, 1)
  assert.deepEqual(await answer(on.hub, on.ana, url, approved, true), {
    ok: false,
    reason: 'not_pending',
  })
  const yes = on.hub.lines.filter((line) => line.message === 'CONNECTOR_WRITE_APPROVED')
  assert.deepEqual(
    yes.map(({ fields }) => [fields.toolCallId, fields.personId, fields.toolName]),
    [[approved, on.ana.id, WRITE]],
  )

  await sent(on.hub, on.ana, url, 'Lance outro')
  const declined = askedOf(await untilAsked(stream)).toolCallId
  assert.deepEqual(await answer(on.hub, on.ana, url, declined, false), { ok: true })
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.match(on.calls[3]?.texts.join('\n') ?? '', /not approved|declined/i)
  const no = on.hub.lines.filter((line) => line.message === 'CONNECTOR_WRITE_DECLINED')
  assert.deepEqual(
    no.map(({ fields }) => fields.toolCallId),
    [declined],
  )

  await sent(on.hub, on.ana, url, 'Lance mais um')
  const overtaken = askedOf(await untilAsked(stream)).toolCallId
  await sleep(PERSON_PACE_MS)
  await sent(on.hub, on.ana, url, 'Espera, são três')
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.deepEqual(await answer(on.hub, on.ana, url, overtaken, true), {
    ok: false,
    reason: 'not_pending',
  })

  await sent(on.hub, on.ana, url, 'Lance de novo')
  const halted = askedOf(await untilAsked(stream)).toolCallId
  await sleep(PERSON_PACE_MS)
  assert.equal((await stopped(on.hub, on.ana, url)).statusCode, 200)
  await stream.turn()
  assert.deepEqual(await answer(on.hub, on.ana, url, halted, true), {
    ok: false,
    reason: 'not_pending',
  })
  assert.equal(on.fake.orders().length, 1, 'only the approved call reached the Sankhya')
})

test('depois do reinício: o Hub novo não traz o pedido, o Aprovar velho responde ok: false sem enviar e a mensagem seguinte roda um turno normal (8)', async (t) => {
  const on = await approving(t, [[launched()], [said('Oi de novo.')]])
  const agent = await on.writer('ASK')
  const { url, stream } = await on.opened(agent.id)
  await sent(on.hub, on.ana, url, 'Lance o pedido')
  const old = askedOf(await untilAsked(stream)).toolCallId

  const beside = await hubBeside(t, on.hub)
  const again = await streamOf(beside, on.ana, url)
  t.after(() => again.close())
  assert.deepEqual((await again.seed()).pendingApprovals, {}, 'no card after the restart')
  assert.deepEqual(await answer(beside, on.ana, url, old, true), {
    ok: false,
    reason: 'not_pending',
  })
  assert.equal((await sent(beside, on.ana, url, 'Oi')).statusCode, 200)
  assert.equal(endOf(await again.turn()), 'complete')
  assert.deepEqual(on.fake.orders(), [])
})

test('o pedido sem resposta pergunta: com um envio aberto da mesma escrita na conversa, a escrita em Faz sozinho para no cartão e Aprovar a envia uma vez; noutra conversa roda sem cartão (20)', async (t) => {
  const on = await approving(t, [
    [launched()],
    [said('Não sei se entrou.')],
    [launched()],
    [said('Lançado.')],
    [launched()],
    [said('Lançado.')],
  ])
  const agent = await on.writer('AUTO')
  const a = await on.opened(agent.id)
  on.fake.orderSwitches.lostAfterStore = true
  await sent(on.hub, on.ana, a.url, 'Lance o pedido')
  assert.deepEqual(approvalsIn(await a.stream.turn()), [])
  on.fake.orderSwitches.lostAfterStore = false
  assert.equal(on.fake.orders().length, 1)

  await sent(on.hub, on.ana, a.url, 'Lance de novo')
  const asked = askedOf(await untilAsked(a.stream))
  assert.equal(asked.toolName, WRITE)
  assert.equal(on.fake.orders().length, 1, 'the card stops the write before the Sankhya')
  assert.deepEqual(await answer(on.hub, on.ana, a.url, asked.toolCallId, true), { ok: true })
  assert.equal(endOf(await a.stream.turn()), 'complete')
  assert.equal(on.fake.orders().length, 2)

  const b = await on.opened(agent.id)
  await sent(on.hub, on.ana, b.url, 'Lance o pedido')
  const elsewhere = await b.stream.turn()
  assert.equal(endOf(elsewhere), 'complete')
  assert.deepEqual(approvalsIn(elsewhere), [])
  assert.equal(on.fake.orders().length, 3)
})
