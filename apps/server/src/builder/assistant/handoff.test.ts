import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { HandedOff } from '@conexus/hub-api'
import { post } from '../../hub/identity/test-hub.ts'
import { endOf, messagesOf } from '../conversation/test-conversation.ts'
import { stepping, tool } from '../conversation/test-questions.ts'
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
  builder?: Promise<void>,
) {
  const steps = [
    [write('briefing.md', BRIEFING)],
    [tool(name, { summary: SUMMARY, briefing: 'briefing.md' })],
    [said('Toque o botão.')],
  ]
  const assistant = stepping(steps, [])
  // The Builder's turn on the hand-off held until `builder` settles, when one is given.
  const on = await assisting(
    t,
    builder === undefined
      ? steps
      : (asked) =>
          asked.stream && asked.texts.join('\n').includes('[File: briefing.md]')
            ? { kind: 'hold', until: builder }
            : assistant(asked),
  )
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

/** The person's messages in the Builder's conversation of a hand-off, once its turn had time to end. */
async function signalsOf(on: On, handed: HandedOff): Promise<number> {
  const builder = `${on.company}/projects/${handed.projectId}/conversations/${handed.conversationId}`
  await sleep(500)
  const messages = await messagesOf(on.hub, on.ana, builder)
  return messages.filter((each) => each.role === 'person').length
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

test('a conversa do Builder que o toque abre já tem o pedido do Assistente quando a rota responde, com o turno do Builder ainda no meio', async (t) => {
  const { promise: held, resolve: free } = Promise.withResolvers<void>()
  t.after(free)
  const { on, url, toolCallId } = await proposing(t, APP, undefined, held)
  const body = { toolCallId, projectName: 'Compras', connections: [] }
  const touched = await post(on.hub, on.ana, `${url}/handoffs`, body, randomUUID())
  assert.equal(touched.statusCode, 201, touched.body)
  const handed = HandedOff.parse(touched.json())
  const builder = `${on.company}/projects/${handed.projectId}/conversations/${handed.conversationId}`
  const asked = (await messagesOf(on.hub, on.ana, builder)).filter((each) => each.role === 'person')
  assert.equal(asked.length, 1, 'the signal stored before the answer')
  assert.ok(JSON.stringify(asked[0]?.parts).includes(SUMMARY))
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

  assert.equal(await signalsOf(on, HandedOff.parse(first.json())), 1, 'one signal')

  // Two touches at once, as two tabs or a retry while the first still runs: one signal too.
  const twin = { ...body, projectName: 'Compras ao mesmo tempo' }
  const twinKey = randomUUID()
  const both = await Promise.all([
    post(on.hub, on.ana, `${url}/handoffs`, twin, twinKey),
    post(on.hub, on.ana, `${url}/handoffs`, twin, twinKey),
  ])
  for (const each of both) assert.equal(each.statusCode, 201, each.body)
  const [one, other] = both.map((each) => HandedOff.parse(each.json()))
  assert.ok(one !== undefined)
  assert.deepEqual(one, other)
  await handedCalls(on, 2)
  assert.equal(await signalsOf(on, one), 1, 'one signal at once')
})

test('as recusas: quem não pode gerenciar ligações cria o Projeto sem liberar nada, e uma chamada que não é proposta desta conversa é NOT_FOUND (9)', async (t) => {
  const { on, url, toolCallId } = await proposing(t, APP)
  // Two Sankhyas marked: a Projeto holds one, so the second is refused and the first released.
  const two = { toolCallId, projectName: 'Compras', connections: [on.matriz, on.filial] }
  const key = randomUUID()
  for (const _ of [1, 2]) {
    const touched = await post(on.hub, on.ana, `${url}/handoffs`, two, key)
    assert.equal(touched.statusCode, 201, touched.body)
    const handed = HandedOff.parse(touched.json())
    assert.deepEqual(handed.released, [on.matriz])
    assert.deepEqual(handed.refused, [
      { connectionId: on.filial, code: 'PROJECT_CONNECTION_TAKEN' },
    ])
    assert.deepEqual(await granted(on, handed.projectId), [on.matriz])
  }

  // No role asks the Assistant without managing connections today (`askAssistant`); the
  // connectors' door answers as it will for one.
  const { grants } = on.hub.connectors
  const may = grants.may.bind(grants)
  grants.may = async () => false
  t.after(() => {
    grants.may = may
  })
  const body = { toolCallId, projectName: 'Sem ligações', connections: [on.matriz] }
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

test('a ligação que a conversa não escolheu: marcada no toque, não é liberada (7, 9)', async (t) => {
  const { on, url, toolCallId } = await proposing(t, APP, (on) => ({ connections: [on.matriz] }))
  const body = { toolCallId, projectName: 'Compras', connections: [on.filial] }
  const touched = await post(on.hub, on.ana, `${url}/handoffs`, body, randomUUID())
  assert.equal(touched.statusCode, 201, touched.body)
  const handed = HandedOff.parse(touched.json())
  assert.deepEqual(handed.released, [])
  assert.deepEqual(handed.refused, [{ connectionId: on.filial, code: 'CONNECTION_NOT_FOUND' }])
  assert.deepEqual(await granted(on, handed.projectId), [])
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
