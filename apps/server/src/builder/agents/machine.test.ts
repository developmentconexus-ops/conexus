import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { test } from 'node:test'
import { BRUNO, CARLA, call, codeOf, memberOn } from '../../hub/identity/test-hub.ts'
import { said, talking } from '../assistant/test-assistant.ts'
import { endOf, messagesOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { INSTALLATION } from '../machine/test-machine.ts'
import { agentsOn, publishedAgent, talkedTo } from './test-agents.ts'

const COMMAND = 'mastra_workspace_execute_command'
const WRITE = 'mastra_workspace_write_file'
const SHOW = 'show_file'
const HOSTS = ['registry.npmjs.org', 'pypi.org', 'files.pythonhosted.org']

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
  const { control, folder } = on.hub.assistantMachines
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
  assert.deepEqual(control.allowOut.at(0), HOSTS)
  assert.ok(control.allowOut.every((each) => JSON.stringify(each) === JSON.stringify(HOSTS)))
  const marks = control.marks[0]
  assert.equal(marks?.conexus_company, on.companyId)
  assert.equal(marks?.conexus_project, on.projectId)
  assert.equal(marks?.conexus_agent, agent.id)
  assert.equal(marks?.conexus_conversation, idOf(url))

  const [output] = await shown(on, url)
  assert.deepEqual(output, {
    kind: 'TEXT',
    path: join(folder, 'work', 'vendas.md'),
    name: 'vendas.md',
    media: 'text/markdown',
    content: '# Vendas',
  })
})

test('o Computador: um agente sem a chave não recebe ferramenta de máquina nem show_file, e nenhuma máquina liga; listar os agentes não liga nada (15)', async (t) => {
  const on = await agentsOn(t, [[said('Oi.')]])
  const agent = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  const { control } = on.hub.assistantMachines
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

  const { control } = on.hub.assistantMachines
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
