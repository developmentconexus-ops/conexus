import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { test } from 'node:test'
import { DEVELOPMENT_HOSTS, MACHINE_TOOL } from '@conexus/hub-api'
import { INSTALLATION } from '../../harness/machine/test-machine.ts'
import {
  endOf,
  holding,
  hubBeside,
  messagesOf,
  PARTIAL,
  sent,
  sessionUrl,
  streamOf,
  title,
} from '../../harness/routes/test-conversation.ts'
import { tool } from '../../harness/routes/test-questions.ts'
import { BRUNO, CARLA, call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import { until } from '../../platform/test-until.ts'
import { said, talking } from '../assistant/test-assistant.ts'
import { agentsOn, drafted, madeAgent, publishedAgent, talkedTo } from './test-agents.ts'

const COMMAND = 'mastra_workspace_execute_command'
const WRITE = 'mastra_workspace_write_file'
const SHOW = 'show_file'

function idOf(url: string) {
  return url.slice(url.lastIndexOf('/') + 1)
}

function fileOf(company: string, url: string, path: string) {
  return `${company}/agents/conversations/${idOf(url)}/files?${new URLSearchParams({ path })}`
}

async function shown(on: Awaited<ReturnType<typeof agentsOn>>, url: string) {
  const messages = await messagesOf(on.hub, on.ana, url)
  return messages.flatMap((message) =>
    message.parts.flatMap((part) => {
      const found = Object(part)
      const made = found.toolInvocation
      return found.type === 'tool-invocation' && made?.toolName === SHOW ? [made.result] : []
    }),
  )
}

test('o Computador: o agente roda um comando, escreve um arquivo e o mostra; a máquina liga na primeira ferramenta, com a rede da decisão B e as marcas da empresa, do Projeto e do agente (15, 16)', async (t) => {
  const on = await agentsOn(t, [
    [tool(COMMAND, { command: 'echo oi' })],
    [tool(WRITE, { path: 'vendas.md', content: '# Vendas' })],
    [tool(SHOW, { path: 'vendas.md' })],
    [said('Pronto.')],
  ])
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda.',
    machine: true,
  })
  const { control, folder } = on.hub.conversationMachines
  const url = await talkedTo(on.hub, on.ana, on.agents, agent.id)
  assert.deepEqual(control.names, [], 'opening a conversation starts no machine')

  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Faça um relatório')), 'complete')

  const offered = on.calls[0]?.tools ?? []
  assert.ok(
    offered.includes(COMMAND) && offered.includes(WRITE) && offered.includes(SHOW),
    offered.join(),
  )
  assert.ok(control.names.every((name) => name === `conexus-${INSTALLATION}-${idOf(url)}`))
  assert.ok(control.names.length > 0)
  assert.deepEqual(control.allowOut.at(0), DEVELOPMENT_HOSTS)
  assert.ok(
    control.allowOut.every((each) => JSON.stringify(each) === JSON.stringify(DEVELOPMENT_HOSTS)),
  )
  const marks = control.marks[0]
  assert.equal(marks?.conexus_company, on.companyId)
  assert.equal(marks?.conexus_project, on.projectId)
  assert.equal(marks?.conexus_agent, agent.id)
  assert.equal(marks?.conexus_conversation, idOf(url))

  await new Promise((done) => setTimeout(done, 200))
  assert.equal(control.stops, 0, 'the turn’s end does not stop the machine')

  const [output] = await shown(on, url)
  assert.deepEqual(output, {
    kind: 'TEXT',
    path: join(folder, 'work', 'vendas.md'),
    name: 'vendas.md',
    media: 'text/markdown',
    content: '# Vendas',
  })
})

test('a rede: a máquina do agente salvo parte com os domínios da empresa, e remover um pela rota a fecha na hora (8, 10)', async (t) => {
  const on = await agentsOn(t, [[tool(COMMAND, { command: 'echo oi' })], [said('Pronto.')]])
  const domains = `/api/companies/${on.companyId}/network/domains`
  const asked = { domain: 'api.example.com', reason: 'Ler o catálogo de preços' }
  const added = await post(on.hub, on.ana, domains, asked)
  assert.equal(added.statusCode, 200, added.body)
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda.',
    machine: true,
  })
  const url = await talkedTo(on.hub, on.ana, on.agents, agent.id)
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Rode')), 'complete')
  const { control } = on.hub.conversationMachines
  function sent() {
    return control.networkApplied.map((each) => each.hosts)
  }
  assert.deepEqual(sent(), [[...DEVELOPMENT_HOSTS, 'api.example.com']])
  const one = Object(added.json()).id
  const removed = await call(on.hub, on.ana, 'DELETE', `${domains}/${one}`)
  assert.equal(removed.statusCode, 204, removed.body)
  await until(() => sent().length === 2, 'the running machine took the shorter list')
  assert.deepEqual(sent().at(-1), DEVELOPMENT_HOSTS)
})

test('a ferramenta vem com o Computador: request_network_access suspende com os alcances do papel de quem fala, só quem conversa responde o cartão, o agente sem Computador não a recebe, e o agente apagado leva a lista das conversas dele (14, 16, 17, 18)', async (t) => {
  const asked = tool(MACHINE_TOOL.requestNetwork, {
    domains: ['loja.example.com'],
    reason: 'ler os preços',
  })
  const on = await agentsOn(t, [[asked], [said('Abriu.')], [said('Oi.')]])
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda.',
    machine: true,
  })
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'developer')
  const url = await talkedTo(on.hub, carla, on.agents, agent.id)
  const { say, stream } = await talking(t, on.hub, carla, url)
  const card = (await say('Leia a loja')).flatMap((event) =>
    event.type === 'tool_suspended' ? [event] : [],
  )[0]
  assert.equal(card?.toolName, MACHINE_TOOL.requestNetwork)
  assert.deepEqual(card.suspendPayload, {
    domains: ['loja.example.com'],
    reason: 'ler os preços',
    scopes: ['CONVERSATION'],
  })
  const answer = { toolCallId: card.toolCallId, resumeData: { scope: 'CONVERSATION' } }
  const route = `${sessionUrl(url)}/tool-suspension`
  const stranger = await post(on.hub, on.ana, route, answer)
  assert.equal(stranger.statusCode, 404, stranger.body)
  const answered = await post(on.hub, carla, route, answer)
  assert.equal(answered.statusCode, 200, answered.body)
  assert.equal(endOf(await stream.turn()), 'complete')
  function allowed() {
    return on.hub.test.asOwner(
      'select conversation_id, person_id, domain from builder.conversation_network_domain',
    )
  }
  assert.deepEqual(await allowed(), [
    { conversation_id: idOf(url), person_id: carla.id, domain: 'loja.example.com' },
  ])

  const plain = await publishedAgent(on.hub, on.ana, on.agents, {
    name: 'Sem computador',
    instructions: 'Responda.',
  })
  const other = await talkedTo(on.hub, on.ana, on.agents, plain.id)
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, other)).say('Oi')), 'complete')
  assert.ok(on.calls[0]?.tools.includes(MACHINE_TOOL.requestNetwork))
  assert.equal(on.calls.at(-1)?.tools.includes(MACHINE_TOOL.requestNetwork), false)

  const gone = await call(on.hub, on.ana, 'DELETE', `${on.agents}/${agent.id}`)
  assert.equal(gone.statusCode, 204, gone.body)
  await until(
    async () => (await allowed()).length === 0,
    'the list of the deleted agent’s conversation left',
  )
})

test('o Computador: um agente sem a chave não recebe ferramenta de máquina nem show_file, e nenhuma máquina liga; listar os agentes não liga nada (15)', async (t) => {
  const on = await agentsOn(t, [[said('Oi.')]])
  const agent = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  const { control } = on.hub.conversationMachines
  const listed = await call(on.hub, on.ana, 'GET', on.listed)
  assert.equal(listed.statusCode, 200, listed.body)
  const url = await talkedTo(on.hub, on.ana, on.agents, agent.id)
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Oi')), 'complete')
  assert.deepEqual(
    (on.calls[0]?.tools ?? []).filter(
      (name) => name.startsWith('mastra_workspace') || name === SHOW,
    ),
    [],
  )
  assert.deepEqual(control.names, [])
})

test('o arquivo: um caminho fora da pasta (por um link) é recusado com SHOW_REFUSED; a rota entrega os bytes ao dono e dá 404 a outra pessoa, ao membro e a conversa que não existe (15)', async (t) => {
  const on = await agentsOn(t, [
    [tool(WRITE, { path: 'relatorio.csv', content: 'a;b\n1;2\n' })],
    [tool(COMMAND, { command: 'ln -s /etc/hostname dentro.md' })],
    [tool(SHOW, { path: 'dentro.md' })],
    [said('Pronto.')],
  ])
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda.',
    machine: true,
  })
  const url = await talkedTo(on.hub, on.ana, on.agents, agent.id)
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Escreva')), 'complete')
  assert.deepEqual(await shown(on, url), [{ kind: 'SHOW_REFUSED', reason: 'OUTSIDE' }])

  const { control } = on.hub.conversationMachines
  control.discoverable.push(`conexus-${INSTALLATION}-${idOf(url)}`)
  const got = await call(on.hub, on.ana, 'GET', fileOf(on.company, url, 'relatorio.csv'))
  assert.equal(got.statusCode, 200, got.body)
  assert.equal(got.body, 'a;b\n1;2\n')
  assert.equal(got.headers['content-type'], 'text/csv')
  assert.match(String(got.headers['content-security-policy']), /(^|; )sandbox$/)
  assert.equal(on.lines.find((line) => line.message === 'AGENT_FILE_READ')?.fields.bytes, 8)

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  for (const person of [carla, bruno]) {
    const refused = await call(on.hub, person, 'GET', fileOf(on.company, url, 'relatorio.csv'))
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'CONVERSATION_NOT_FOUND'])
  }
  const missing = await call(
    on.hub,
    on.ana,
    'GET',
    fileOf(on.company, `${url.slice(0, url.lastIndexOf('/'))}/${randomUUID()}`, 'a.md'),
  )
  assert.deepEqual([missing.statusCode, codeOf(missing)], [404, 'CONVERSATION_NOT_FOUND'])
})

test('o fim do Hub: a máquina do turno do agente em andamento para quando o Hub é parado (C62)', {
  timeout: 60_000,
}, async (t) => {
  const held = holding(t)
  let modelCalls = 0
  const on = await agentsOn(t, (asked) => {
    const titled = title(asked)
    if (titled !== undefined) return titled
    modelCalls += 1
    return modelCalls === 1
      ? { kind: 'blocks', blocks: [tool(WRITE, { path: 'a.txt', content: 'um' })] }
      : held.reply
  })
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda.',
    machine: true,
  })
  const stopping = await hubBeside(t, on.hub)
  const url = await talkedTo(stopping, on.ana, on.agents, agent.id)
  const stream = await streamOf(stopping, on.ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(stopping, on.ana, url, 'Escreva')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  const { control } = stopping.conversationMachines
  control.stopMs = 150
  assert.equal(control.names.length, 1, 'the turn started the machine')
  assert.equal(control.stops, 0, 'and it runs')
  const stopped = stopping.close(300)
  assert.equal(endOf(await stream.turn()), 'aborted')
  await stopped
  assert.equal(control.stops, 1, 'the Hub ending stopped it, and its close waited for the pause')
})

test('o rascunho: gravar sem a chave `machine` mantém o Computador ligado, pela porta HTTP (18)', async (t) => {
  const on = await agentsOn(t)
  const made = await madeAgent(on.hub, on.ana, on.agents)
  const on1 = await drafted(on.hub, on.ana, on.agents, made, { machine: true })
  assert.equal(on1.draft.machine, true)
  const edited = await drafted(on.hub, on.ana, on.agents, on1, {
    instructions: 'Outra.',
    web: false,
  })
  assert.equal(edited.draft.instructions, 'Outra.')
  assert.equal(edited.draft.machine, true)
  const off = await drafted(on.hub, on.ana, on.agents, edited, { machine: false })
  assert.equal(off.draft.machine, false)
})
