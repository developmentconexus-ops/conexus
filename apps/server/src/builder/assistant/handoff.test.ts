import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { HandedOff } from '@conexus/hub-api'
import { post } from '../../hub/identity/test-hub.ts'
import { endOf, messagesOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

const APP = 'propose_app'
const CHANGE = 'propose_app_change'
const SUMMARY = 'O time de compras registra o que pedir a cada fornecedor, lendo o giro do Sankhya.'
const BRIEFING =
  '# Compras\n\nQuem usa: o time de compras.\n\n## Em aberto\n\n- Quem aprova o pedido?'

type On = Awaited<ReturnType<typeof assisting>>

function write(path: string, content: string) {
  return tool('mastra_workspace_write_file', { path, content })
}

/** The id of the conversation's one call of `name`, read from its stored messages. */
async function callIdOf(on: On, url: string, name: string): Promise<string> {
  const messages = await messagesOf(on.hub, on.ana, url)
  const ids = messages.flatMap((message) =>
    message.parts.flatMap((part) => {
      const call = Object(part).toolInvocation
      return Object(part).type === 'tool-invocation' && call?.toolName === name
        ? [String(call.toolCallId)]
        : []
    }),
  )
  assert.equal(ids.length, 1, `one ${name} call`)
  return String(ids[0])
}

/** A conversation of the Assistant whose model proposed with `name`, then said its end. */
async function proposing(
  t: Parameters<typeof assisting>[0],
  name: string,
  place: (on: On) => object = (on) => ({ connections: [on.matriz, on.filial] }),
) {
  const on = await assisting(t, [
    [write('briefing.md', BRIEFING)],
    [tool(name, { summary: SUMMARY, briefing: 'briefing.md' })],
    [said('Toque o botão.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, place(on))
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quero um app de compras')), 'complete')
  return { on, url, toolCallId: await callIdOf(on, url, name) }
}

/** The model's calls that read the hand-off, once the Builder's turn asked it (ten seconds at most). */
async function handedCalls(on: On, at = 1): Promise<string[]> {
  for (let tries = 0; tries < 100; tries += 1) {
    const read = on.calls
      .map((each) => each.texts.join('\n'))
      .filter((each) => each.includes(SUMMARY))
    const builder = read.filter((each) => each.includes('[File: briefing.md]'))
    if (builder.length >= at) return builder
    await sleep(100)
  }
  assert.fail('the Builder never asked the model with the hand-off')
}

async function granted(on: On, projectId: string): Promise<string[]> {
  const rows = await on.hub.test.asOwner(
    'select connection_id from connectors.project_connection where project_id = $1 order by 1',
    [projectId],
  )
  return rows.map((row) => String(Object(row).connection_id))
}

async function projectCount(on: On): Promise<number> {
  const rows = await on.hub.test.asOwner('select count(*)::int as n from projects.project')
  return Number(Object(rows[0]).n)
}

test('a entrega: o toque cria o Projeto, libera só a ligação marcada, abre uma conversa do Builder e o Builder recebe o sinal do Assistente com o resumo e o briefing como arquivo (7)', async (t) => {
  const { on, url, toolCallId } = await proposing(t, APP)
  const body = { toolCallId, projectName: 'Compras', connections: [on.matriz] }
  const touched = await post(on.hub, on.ana, `${url}/handoffs`, body, randomUUID())
  assert.equal(touched.statusCode, 201, touched.body)
  const handed = HandedOff.parse(touched.json())
  assert.notEqual(handed.projectId, on.projectId)
  assert.deepEqual(handed.released, [on.matriz])
  assert.deepEqual(handed.refused, [])
  assert.deepEqual(await granted(on, handed.projectId), [on.matriz])

  const [read] = await handedCalls(on)
  assert.match(read ?? '', /source="assistant"/)
  assert.ok(read?.includes(`assistantConversation="${url.split('/').at(-1)}"`), read)
  assert.ok(read?.includes(BRIEFING), 'the briefing whole, fenced as a file')
})

test('o toque repetido: a mesma chave devolve o mesmo Projeto e a mesma conversa, e o sinal sai uma vez (8)', async (t) => {
  const { on, url, toolCallId } = await proposing(t, APP)
  const body = { toolCallId, projectName: 'Compras', connections: [on.matriz] }
  const key = randomUUID()
  const first = await post(on.hub, on.ana, `${url}/handoffs`, body, key)
  assert.equal(first.statusCode, 201, first.body)
  await handedCalls(on)
  const projects = await projectCount(on)
  const again = await post(on.hub, on.ana, `${url}/handoffs`, body, key)
  assert.equal(again.statusCode, 201, again.body)
  assert.deepEqual(HandedOff.parse(again.json()), HandedOff.parse(first.json()))
  assert.equal(await projectCount(on), projects)

  const handed = HandedOff.parse(first.json())
  const builder = `${on.company}/projects/${handed.projectId}/conversations/${handed.conversationId}`
  await sleep(500)
  const asked = (await messagesOf(on.hub, on.ana, builder)).filter((each) => each.role === 'person')
  assert.equal(asked.length, 1, 'one signal')
})

test('as recusas: quem não pode gerenciar ligações cria o Projeto sem liberar nada, e uma chamada que não é proposta desta conversa é NOT_FOUND (9)', async (t) => {
  const { on, url, toolCallId } = await proposing(t, APP)
  // No role asks the Assistant without managing connections today (`askAssistant`); the
  // connectors' door answers as it will for one.
  const { grants } = on.hub.connectors
  const may = grants.may.bind(grants)
  grants.may = async () => false
  t.after(() => {
    grants.may = may
  })
  const body = { toolCallId, projectName: 'Compras', connections: [on.matriz] }
  const touched = await post(on.hub, on.ana, `${url}/handoffs`, body, randomUUID())
  assert.equal(touched.statusCode, 201, touched.body)
  const handed = HandedOff.parse(touched.json())
  assert.deepEqual(handed.released, [])
  assert.deepEqual(handed.refused, [{ connectionId: on.matriz, code: 'CONNECTIONS_NOT_ALLOWED' }])
  assert.deepEqual(await granted(on, handed.projectId), [])

  const unknown = { toolCallId: 'toolu_outra', projectName: 'Outro', connections: [] }
  const refused = await post(on.hub, on.ana, `${url}/handoffs`, unknown, randomUUID())
  assert.equal(refused.statusCode, 404, refused.body)
  assert.equal(Object(refused.json()).code, 'NOT_FOUND')
})

test('a mudança no Projeto: a mesma rota abre uma conversa nova do Builder desse Projeto e não cria Projeto (10)', async (t) => {
  const { on, url, toolCallId } = await proposing(t, CHANGE, (on) => ({
    projectId: on.projectId,
    connections: [on.matriz],
  }))
  const projects = await projectCount(on)
  const body = { toolCallId, connections: [] }
  const touched = await post(on.hub, on.ana, `${url}/handoffs`, body, randomUUID())
  assert.equal(touched.statusCode, 201, touched.body)
  const handed = HandedOff.parse(touched.json())
  assert.equal(handed.projectId, on.projectId)
  assert.equal(await projectCount(on), projects)
  const [read] = await handedCalls(on)
  assert.match(read ?? '', /source="assistant"/)
  const builder = `${on.company}/projects/${on.projectId}/conversations/${handed.conversationId}`
  assert.ok((await messagesOf(on.hub, on.ana, builder)).length > 0)
})
