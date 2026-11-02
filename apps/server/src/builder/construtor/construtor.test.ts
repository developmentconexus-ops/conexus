import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONSTRUTOR_TOOL } from '@conexus/hub-api'
import { call } from '../../hub/identity/test-hub.ts'
import { agentOf, drafted, madeAgent, ordersOf, otherProject } from '../agents/test-agents.ts'
import { created, salesSummary } from '../automations/test-automations.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import type { Step } from './test-construtor.ts'
import { building, keeping, listOf, resultOf } from './test-construtor.ts'

const FIRST = 'Responda sobre as vendas do dia.'

test('o rascunho pelo Construtor: o modelo cria o agente e muda o rascunho, e a rota da U1 o lê', async (t) => {
  const answers: Record<string, unknown>[] = []
  const on = await building(t, [
    () => [tool('agent_draft', { name: 'Vendas do dia', description: 'Conta as vendas' })],
    (asked) => {
      const agent = Object(resultOf(asked).agent)
      return [
        tool('agent_set', { agentId: agent.id, revision: agent.revision, instructions: FIRST }),
      ]
    },
    keeping(answers),
  ])
  assert.equal(endOf(await on.conversation.say('Quero um agente de vendas')), 'complete')

  const saved = answers[0]
  assert.equal(saved?.kind, 'SAVED')
  const read = await call(on.hub, on.ana, 'GET', `${on.agents}/${String(Object(saved?.agent).id)}`)
  const agent = agentOf(read)
  assert.equal(agent.state.kind, 'DRAFT')
  assert.equal(agent.draft.instructions, FIRST)
  assert.equal(agent.revision, 2)
})

test('as ferramentas: o modelo recebe as instruções do Construtor e só as ferramentas da lista fechada', async (t) => {
  const on = await building(t, [])
  assert.equal(endOf(await on.conversation.say('Oi')), 'complete')
  const asked = on.calls.at(-1)
  assert.ok(asked)
  assert.match(asked.system, /Você é o Construtor do Conexus/)
  assert.match(asked.system, /Nunca publique/)
  const closed = [...Object.values(CONSTRUTOR_TOOL), 'connector_read', 'connector_notes']
  assert.deepEqual([...asked.tools].sort(), [...closed, 'web_fetch', 'web_search'].sort())
})

test('ler o Projeto: o nome, só as ligações que o Projeto recebeu e os agentes com o estado', async (t) => {
  const answers: Record<string, unknown>[] = []
  const on = await building(t, [() => [tool('project_read', {})], keeping(answers)])
  await madeAgent(on.hub, on.ana, on.agents, 'Conferente')
  assert.equal(endOf(await on.conversation.say('O que o Projeto tem?')), 'complete')

  const [seen] = answers
  assert.equal(Object(seen?.project).name, 'Encomendas')
  assert.deepEqual(
    listOf(seen?.offered).map((each) => each.name),
    ['Matriz'],
  )
  assert.deepEqual(
    listOf(seen?.agents).map((each) => [each.name, each.state]),
    [['Conferente', { kind: 'DRAFT' }]],
  )
})

test('o rascunho pelo Construtor: procura e grava a ferramenta e a escolhe no rascunho', async (t) => {
  const answers: Record<string, unknown>[] = []
  let connection = ''
  function keep(asked: Parameters<Step>[0]): void {
    answers.push(resultOf(asked))
  }
  const on = await building(t, [
    () => [tool('tool_search', {})],
    (asked) => {
      keep(asked)
      const orders = listOf(answers[0]?.ready).find((each) => each.operation === 'pedidos')
      assert.ok(orders, 'a ready read of pedidos')
      connection = String(orders.connectionId)
      return [tool('tool_save', ordersOf(connection))]
    },
    (asked) => {
      keep(asked)
      return [tool('agent_draft', { name: 'Pedidos', description: 'Os pedidos' })]
    },
    (asked) => {
      keep(asked)
      const agent = Object(answers[2]?.agent)
      const version = Object(Object(answers[1]?.tool).latest)
      return [
        tool('agent_set', {
          agentId: agent.id,
          revision: agent.revision,
          tools: [version.id],
          ready: [{ connectionId: connection, operation: 'empresas' }],
        }),
      ]
    },
    keeping(answers),
  ])
  const inProject = salesSummary([], { projectId: on.projectId })
  await created(on.hub, on.ana, `${on.company}/automations`, inProject)
  await created(
    on.hub,
    on.ana,
    `${on.company}/automations`,
    salesSummary([], { name: 'Do Início' }),
  )
  assert.equal(endOf(await on.conversation.say('Monte um agente de pedidos')), 'complete')

  assert.deepEqual(
    listOf(answers[0]?.automations).map((each) => each.name),
    ['Resumo de vendas'],
  )

  assert.equal(answers[1]?.kind, 'SAVED')
  assert.equal(answers[3]?.kind, 'SAVED')
  const slugs = listOf(Object(answers[3]?.agent).tools).map((each) => String(each.slug))
  assert.equal(slugs.length, 2)
  assert.ok(slugs.includes('pedidos_matriz'), 'the tool the Construtor made')
  assert.ok(
    slugs.some((slug) => slug.startsWith('empresas_')),
    'the ready read it chose',
  )
})

test('o rascunho pelo Construtor: depois que a pessoa muda o painel, o revision velho volta recusado com o rascunho de agora, e grava de novo sobre ele', async (t) => {
  const answers: Record<string, unknown>[] = []
  let agentId = ''
  const stale: Step = () => [
    tool('agent_set', { agentId, revision: 1, instructions: 'Do Construtor.' }),
  ]
  const on = await building(t, [
    () => [tool('agent_draft', { name: 'Vendas', description: 'Vendas' })],
    keeping(answers),
    stale,
    (asked) => {
      answers.push(resultOf(asked))
      const current = Object(Object(answers[1]?.current))
      return [
        tool('agent_set', { agentId, revision: current.revision, instructions: 'Do Construtor.' }),
      ]
    },
    keeping(answers),
  ])
  assert.equal(endOf(await on.conversation.say('Crie')), 'complete')
  agentId = String(Object(Object(answers[0]).agent).id)
  const read = agentOf(await call(on.hub, on.ana, 'GET', `${on.agents}/${agentId}`))
  await drafted(on.hub, on.ana, on.agents, read, { instructions: 'Da pessoa.' })

  assert.equal(endOf(await on.conversation.say('Mude')), 'complete')
  assert.deepEqual([answers[1]?.kind, answers[1]?.code], ['REFUSED', 'AGENT_DRAFT_STALE'])
  assert.equal(Object(Object(answers[1]).current).draft.instructions, 'Da pessoa.')
  assert.equal(answers[2]?.kind, 'SAVED')
  const after = agentOf(await call(on.hub, on.ana, 'GET', `${on.agents}/${agentId}`))
  assert.equal(after.draft.instructions, 'Do Construtor.')
})

test('testar: roda uma pergunta contra o rascunho, sem conversa guardada; rascunho inválido e agente de outro Projeto voltam recusados', async (t) => {
  const answers: Record<string, unknown>[] = []
  let ready = ''
  let empty = ''
  let foreign = ''
  const on = await building(t, [
    () => [tool('agent_test', { agentId: ready, question: 'Quanto vendemos?' })],
    (asked) => {
      answers.push(resultOf(asked))
      return [tool('agent_test', { agentId: empty, question: 'Quanto vendemos?' })]
    },
    (asked) => {
      answers.push(resultOf(asked))
      return [tool('agent_test', { agentId: foreign, question: 'Quanto vendemos?' })]
    },
    keeping(answers),
  ])
  const agent = await madeAgent(on.hub, on.ana, on.agents)
  ready = (
    await drafted(on.hub, on.ana, on.agents, agent, {
      instructions: FIRST,
      memory: { observational: false },
    })
  ).id
  empty = (await madeAgent(on.hub, on.ana, on.agents, 'Vazio')).id
  const other = await otherProject(on.hub, on.ana, on.company, [on.matriz], 'Outro')
  foreign = (await madeAgent(on.hub, on.ana, other.agents, 'De fora')).id

  assert.equal(endOf(await on.conversation.say('Teste')), 'complete')
  assert.deepEqual(answers[0], { kind: 'ANSWERED', text: 'Título', tools: [] })
  assert.deepEqual(answers[1], {
    kind: 'REFUSED',
    code: 'AGENT_DRAFT_INVALID',
    field: 'instructions',
  })
  assert.deepEqual(answers[2], { kind: 'REFUSED', code: 'AGENT_NOT_FOUND' })
  const asked = on.anthropic.sent.filter((each) => !each.stream).at(-1)
  assert.match(asked?.system ?? '', /Responda sobre as vendas do dia\./)
})
