import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { HandedOff } from '@conexus/hub-api'
import { BRUNO, CARLA, call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import { endOf, messagesOf, sent } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

type Listed = { conversations: { id: string }[] }

test('o membro conversa: abre, escreve e lê as suas conversas no Início e no Projeto, na rota do Hub e na do Mastra; a de outra pessoa, CONVERSATION_NOT_FOUND', async (t) => {
  const on = await assisting(t)
  const hers = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const home = await created(on.hub, bruno, on.assistant, { connections: [] })
  const inProject = await created(on.hub, bruno, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  for (const url of [home, inProject]) {
    const { say } = await talking(t, on.hub, bruno, url)
    assert.equal(endOf(await say('Oi')), 'complete')
    assert.equal((await call(on.hub, bruno, 'GET', url)).statusCode, 200)
  }
  const listed: Listed = Object((await call(on.hub, bruno, 'GET', on.assistant)).json())
  assert.deepEqual(
    listed.conversations.map((each) => each.id).sort(),
    [home.split('/').at(-1), inProject.split('/').at(-1)].sort(),
  )
  assert.equal(codeOf(await call(on.hub, bruno, 'GET', hers)), 'CONVERSATION_NOT_FOUND')
  assert.equal((await sent(on.hub, bruno, hers, 'Oi')).statusCode, 404)
})

test('o membro vê as ligações do lugar: no Início e no Projeto, as mesmas que a dona vê no mesmo lugar', async (t) => {
  const on = await assisting(t)
  const offered = `${on.company}/assistant/connections`
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  for (const at of [offered, `${offered}?projectId=${on.projectId}`]) {
    const hers = await call(on.hub, on.ana, 'GET', at)
    const his = await call(on.hub, bruno, 'GET', at)
    assert.equal(his.statusCode, 200, his.body)
    assert.deepEqual(
      Object(his.json()).connections.map((each: { name: string }) => each.name),
      Object(hers.json()).connections.map((each: { name: string }) => each.name),
      at,
    )
  }
  const names = Object((await call(on.hub, bruno, 'GET', offered)).json()).connections
  assert.deepEqual(
    names.map((each: { name: string }) => each.name),
    ['Matriz', 'Filial'],
  )
})

test('o membro não recebe propor automação: a execução de quem não cria automações não leva a ferramenta, a do desenvolvedor e a da dona levam, e uma chamada inventada não cria nada', async (t) => {
  const on = await assisting(t)
  const roles = [
    ['member', BRUNO, false],
    ['developer', CARLA, true],
  ] as const
  const owner = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const hers = await talking(t, on.hub, on.ana, owner)
  assert.equal(endOf(await hers.say('Oi')), 'complete')
  assert.equal(on.calls.at(-1)?.tools.includes('propose_automation'), true, 'owner')
  for (const [role, who, mayAutomate] of roles) {
    const person = await memberOn(on.hub, on.companyId, who, role)
    const url = await created(on.hub, person, on.assistant, { connections: [on.matriz] })
    const { say } = await talking(t, on.hub, person, url)
    assert.equal(endOf(await say('Todo dia às 7h me lembre de conferir o caixa')), 'complete')
    const tools = on.calls.at(-1)?.tools ?? []
    assert.equal(tools.includes('propose_automation'), mayAutomate, role)
    assert.equal(tools.includes('show_file'), true, role)
  }
  const steps: ReturnType<typeof said>[][] = []
  const invented = await assisting(t, steps)
  steps.push(
    [
      tool('propose_automation', {
        name: 'Conferir o caixa',
        prompt: 'Lembre de conferir o caixa.',
        cadence: { kind: 'DAILY', time: '07:00' },
        connections: [],
      }),
    ],
    [said('Peça a um administrador.')],
  )
  const bruno = await memberOn(invented.hub, invented.companyId, BRUNO, 'member')
  const url = await created(invented.hub, bruno, invented.assistant, { connections: [] })
  const asking = await talking(t, invented.hub, bruno, url)
  assert.equal(endOf(await asking.say('Todo dia às 7h me lembre de conferir o caixa')), 'complete')
  assert.match(invented.calls.at(1)?.texts.join('\n') ?? '', /not found/i)
  const listed = await call(invented.hub, invented.ana, 'GET', `${invented.company}/automations`)
  assert.deepEqual(Object(listed.json()).automations, [])
})

const SUMMARY = 'O time de compras registra o que pedir a cada fornecedor, lendo o giro do Sankhya.'

test('o passe do membro e do desenvolvedor ao Builder cria o Projeto e abre o Builder; as ligações marcadas voltam CONNECTIONS_NOT_ALLOWED e nenhuma é liberada (F2)', async (t) => {
  const once = [
    [
      tool('mastra_workspace_write_file', {
        path: 'briefing.md',
        content: '# Compras\n\nQuem usa: o time.',
      }),
    ],
    [tool('propose_app', { summary: SUMMARY, briefing: 'briefing.md' })],
    [said('Toque o botão.')],
  ]
  for (const [role, who] of [
    ['member', BRUNO],
    ['developer', CARLA],
  ] as const) {
    // The hand-off's Builder turn takes the model's next answers, so each person has a world.
    const on = await assisting(t, [...once])
    const person = await memberOn(on.hub, on.companyId, who, role)
    const url = await created(on.hub, person, on.assistant, { connections: [on.matriz] })
    const { say } = await talking(t, on.hub, person, url)
    assert.equal(endOf(await say('Quero um app de compras')), 'complete', role)
    const proposed = (await messagesOf(on.hub, person, url)).flatMap((message) =>
      message.parts.flatMap((part) => {
        const call = Object(part).toolInvocation
        return call?.toolName === 'propose_app' ? [String(call.toolCallId)] : []
      }),
    )
    assert.equal(proposed.length, 1, role)
    const before = await on.hub.test.asOwner('select count(*)::int as n from projects.project')
    const body = {
      toolCallId: proposed[0],
      projectName: `Compras ${role}`,
      connections: [on.matriz],
      deliver: true,
    }
    const touched = await post(on.hub, person, `${url}/handoffs`, body, randomUUID())
    assert.equal(touched.statusCode, 201, touched.body)
    const handed = HandedOff.parse(touched.json())
    assert.deepEqual(handed.released, [], role)
    assert.deepEqual(
      handed.refused,
      [{ connectionId: on.matriz, code: 'CONNECTIONS_NOT_ALLOWED' }],
      role,
    )
    const after = await on.hub.test.asOwner('select count(*)::int as n from projects.project')
    assert.equal(Number(Object(after[0]).n), Number(Object(before[0]).n) + 1, role)
    const granted = await on.hub.test.asOwner(
      'select connection_id from connectors.project_connection where project_id = $1',
      [handed.projectId],
    )
    assert.deepEqual(granted, [], role)
    const builder = `${on.company}/projects/${handed.projectId}/conversations/${handed.conversationId}`
    const deadline = Date.now() + 5000
    let opened = await messagesOf(on.hub, person, builder)
    while (opened.length === 0 && Date.now() < deadline) {
      await sleep(100)
      opened = await messagesOf(on.hub, person, builder)
    }
    assert.ok(opened.length > 0, `${role}: the Builder opened`)
  }
})
