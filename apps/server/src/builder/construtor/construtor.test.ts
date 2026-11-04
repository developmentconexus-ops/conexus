import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CONSTRUTOR_TOOL,
  DraftRef,
  ProjectReadResult,
  TestedResult,
  ToolSearchResult,
} from '@conexus/hub-api'
import { ASK, folder, MIGRATION, send, versionWriting } from '../../hub/apps/test-versions.ts'
import { call } from '../../hub/identity/test-hub.ts'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import {
  agentOf,
  agentsOn,
  drafted,
  madeAgent,
  madeTool,
  ordersOf,
  otherProject,
} from '../agents/test-agents.ts'
import { talking } from '../assistant/test-assistant.ts'
import { created, salesSummary } from '../automations/test-automations.ts'
import { endOf, KEY } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import type { Step } from './test-construtor.ts'
import { building, keeping, listOf, opened, resultOf, scripted } from './test-construtor.ts'

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
  assert.doesNotThrow(() => DraftRef.parse(saved))
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
  assert.deepEqual(
    [...asked.tools].sort(),
    [...closed, 'ask_user', 'web_fetch', 'web_search'].sort(),
  )
})

test('ler o Projeto: o nome, só as ligações que o Projeto recebeu e os agentes com o estado', async (t) => {
  const answers: Record<string, unknown>[] = []
  const on = await building(t, [() => [tool('project_read', {})], keeping(answers)])
  await madeAgent(on.hub, on.ana, on.agents, 'Conferente')
  assert.equal(endOf(await on.conversation.say('O que o Projeto tem?')), 'complete')

  const [seen] = answers
  assert.doesNotThrow(() => ProjectReadResult.parse(seen))
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

test('ler o Projeto: sem app, app é null; com app, as tabelas com as colunas, sem o livro das migrações e sem uma linha', async (t) => {
  const without: Record<string, unknown>[] = []
  const bare = await building(t, [() => [tool('project_read', {})], keeping(without)])
  assert.equal(endOf(await bare.conversation.say('O que o Projeto tem?')), 'complete')
  assert.equal(without[0]?.app, null)

  const answers: Record<string, unknown>[] = []
  const writing = versionWriting()
  const steps = scripted([() => [tool('project_read', {})], keeping(answers)])
  const on = await agentsOn(t, (sent) =>
    sent.texts.some((text) => text.startsWith(ASK)) ? writing(sent) : steps(sent),
  )
  const [neonProject] = on.hub.neon.projects()
  assert.ok(neonProject)
  on.hub.neon.ownedBy(neonProject.id, await createCompanyDatabase(t))
  const subject = { t, hub: on.hub, projects: `${on.company}/projects`, projectId: on.projectId }
  const sent = await send(subject, on.ana, folder({ migrations: [MIGRATION] }))
  assert.equal(sent.preview?.state, 'ready')
  const conversation = await talking(t, on.hub, on.ana, await opened(on))
  assert.equal(endOf(await conversation.say('O que o Projeto tem?')), 'complete')
  assert.deepEqual(Object(answers[0]?.app), {
    tables: [{ name: 'recado', columns: ['id', 'texto'] }],
  })
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
      assert.doesNotThrow(() => ToolSearchResult.parse(answers[0]))
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
  for (const answer of answers.slice(0, 3)) assert.doesNotThrow(() => TestedResult.parse(answer))
  assert.deepEqual(answers[0], { kind: 'ANSWERED', text: 'Título', tools: [] })
  assert.deepEqual(answers[1], {
    kind: 'REFUSED',
    code: 'AGENT_DRAFT_INVALID',
    field: 'instructions',
  })
  assert.deepEqual(answers[2], { kind: 'REFUSED', code: 'AGENT_NOT_FOUND' })
  const asked = on.anthropic.sent.filter((each) => !each.stream).at(-1)
  assert.match(asked?.system ?? '', /Responda sobre as vendas do dia\./)
  assert.equal(asked?.key, KEY, 'counted in the person’s own model queue')
})

test('o registro diz quem gravou: CONSTRUTOR nas ferramentas do Construtor, PERSON nas rotas da pessoa', async (t) => {
  const answers: Record<string, unknown>[] = []
  let connection = ''
  const on = await building(t, [
    () => [tool('tool_search', {})],
    (asked) => {
      answers.push(resultOf(asked))
      const orders = listOf(answers[0]?.ready).find((each) => each.operation === 'pedidos')
      assert.ok(orders, 'a ready read of pedidos')
      connection = String(orders.connectionId)
      return [tool('tool_save', ordersOf(connection))]
    },
    (asked) => {
      const version = Object(Object(resultOf(asked).tool).latest)
      assert.ok(version.id, 'the version the Construtor saved')
      return [tool('agent_draft', { name: 'Pedidos', description: 'Os pedidos' })]
    },
    (asked) => {
      const agent = Object(resultOf(asked).agent)
      return [
        tool('agent_set', { agentId: agent.id, revision: agent.revision, instructions: FIRST }),
      ]
    },
    keeping(answers),
  ])
  assert.equal(endOf(await on.conversation.say('Monte um agente de pedidos')), 'complete')
  function byOf(message: string) {
    return on.lines.filter((line) => line.message === message).map((line) => line.fields.by)
  }
  assert.deepEqual(byOf('TOOL_SAVED'), ['CONSTRUTOR'])
  assert.deepEqual(byOf('AGENT_DRAFT_SAVED'), ['CONSTRUTOR'])

  const own = await madeTool(
    on.hub,
    on.ana,
    on.tools,
    ordersOf(connection, { slug: 'pedidos_dela' }),
  )
  assert.equal(own.slug, 'pedidos_dela')
  const agent = await madeAgent(on.hub, on.ana, on.agents, 'Dela')
  await drafted(on.hub, on.ana, on.agents, agent, { instructions: FIRST })
  assert.deepEqual(byOf('TOOL_SAVED'), ['CONSTRUTOR', 'PERSON'])
  assert.deepEqual(byOf('AGENT_DRAFT_SAVED'), ['CONSTRUTOR', 'PERSON'])
})

test('testar: um rascunho cujo modelo a pessoa não tem conta volta recusado MODEL_NO_ACCOUNT, não como falha do modelo', async (t) => {
  const answers: Record<string, unknown>[] = []
  let draft = ''
  const on = await building(t, [
    () => [tool('agent_test', { agentId: draft, question: 'Quanto vendemos?' })],
    keeping(answers),
  ])
  const agent = await madeAgent(on.hub, on.ana, on.agents)
  draft = (
    await drafted(on.hub, on.ana, on.agents, agent, {
      instructions: FIRST,
      model: 'openai/gpt-5',
      memory: { observational: false },
    })
  ).id
  assert.equal(endOf(await on.conversation.say('Teste')), 'complete')
  assert.deepEqual(answers[0], { kind: 'REFUSED', code: 'MODEL_NO_ACCOUNT' })
})
