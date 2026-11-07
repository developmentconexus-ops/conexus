import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { CARLA, call, codeOf, memberOn, personOn, post } from '../../hub/identity/test-hub.ts'
import { talking } from '../assistant/test-assistant.ts'
import {
  endOf,
  holding,
  hubBeside,
  MODEL,
  PARTIAL,
  sent,
  sessionUrl,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import {
  agentsOn,
  drafted,
  madeAgent,
  madeTool,
  ordersOf,
  publishedAgent,
  talkedTo,
} from './test-agents.ts'

const CONEXUS = readFileSync(new URL('../conversation/prompt/conexus.md', import.meta.url), 'utf8')
const ORDERS = 'tool_pedidos_matriz'

/** The model and effort the conversation's session holds, by Mastra's own route. */
async function sessionModel(hub: Hub, person: Parameters<typeof call>[1], url: string) {
  const read = await call(hub, person, 'GET', sessionUrl(url))
  assert.equal(read.statusCode, 200, read.body)
  return String(Object(read.json()).modelId)
}

test('abrir: a conversa com o publicado e a de teste com o rascunho nascem no modelo da versão; sem versão, AGENT_NOT_PUBLISHED; sem conta, MODEL_NO_ACCOUNT; a lista é só da pessoa', async (t) => {
  const on = await agentsOn(t)
  const draft = await madeAgent(on.hub, on.ana, on.agents)
  const unpublished = await post(
    on.hub,
    on.ana,
    `${on.agents}/${draft.id}/conversations`,
    {},
    randomUUID(),
  )
  assert.deepEqual([unpublished.statusCode, codeOf(unpublished)], [409, 'AGENT_NOT_PUBLISHED'])
  const testing = await talkedTo(on.hub, on.ana, on.agents, draft.id, { draft: true })
  assert.equal(await sessionModel(on.hub, on.ana, testing), MODEL, 'model: null is the person’s')

  const haiku = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda.',
    model: 'anthropic/claude-haiku-4-5',
  })
  const url = await talkedTo(on.hub, on.ana, on.agents, haiku.id)
  assert.equal(await sessionModel(on.hub, on.ana, url), 'anthropic/claude-haiku-4-5')

  const gpt = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda.',
    model: 'openai/gpt-5',
  })
  const refused = await post(
    on.hub,
    on.ana,
    `${on.agents}/${gpt.id}/conversations`,
    {},
    randomUUID(),
  )
  assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'MODEL_NO_ACCOUNT'])

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  await talkedTo(on.hub, carla, on.agents, haiku.id)
  const listed = await call(on.hub, on.ana, 'GET', `${on.agents}/${haiku.id}/conversations`)
  assert.equal(listed.statusCode, 200, listed.body)
  const conversations: { id: string; draft: boolean }[] = Object(listed.json()).conversations
  assert.deepEqual(
    conversations.map((each) => [each.id, each.draft]),
    [[url.slice(url.lastIndexOf('/') + 1), false]],
  )
})

test('as ferramentas: o modelo recebe a mensagem do Conexus, as instruções da versão e só as ferramentas dela; a conversa de teste relê o rascunho a cada turno', async (t) => {
  const on = await agentsOn(t)
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre as vendas.',
    connections: [on.matriz],
    tools: [orders.latest.id],
  })
  const conversation = await talking(
    t,
    on.hub,
    on.ana,
    await talkedTo(on.hub, on.ana, on.agents, agent.id),
  )
  assert.equal(endOf(await conversation.say('Quanto vendemos?')), 'complete')
  const asked = on.calls.at(-1)
  assert.ok(asked)
  assert.ok(asked.system.startsWith(CONEXUS.trim().slice(0, 200)))
  assert.ok(asked.system.indexOf('Responda sobre as vendas.') > asked.system.indexOf('Company:'))
  assert.deepEqual(asked.tools.toSorted(), ['connector_notes', ORDERS])

  const draft = await talking(
    t,
    on.hub,
    on.ana,
    await talkedTo(on.hub, on.ana, on.agents, agent.id, { draft: true }),
  )
  const read = await call(on.hub, on.ana, 'GET', `${on.agents}/${agent.id}`)
  const changed = await drafted(on.hub, on.ana, on.agents, Object(read.json()).agent, {
    instructions: 'Responda sobre o estoque.',
    web: true,
    tools: [],
    connections: [],
  })
  assert.equal(endOf(await draft.say('E o estoque?')), 'complete')
  const tested = on.calls.at(-1)
  assert.match(tested?.system ?? '', /Responda sobre o estoque\./)
  assert.deepEqual(tested?.tools.toSorted(), ['web_fetch', 'web_search'])
  assert.equal(changed.revision, agent.revision + 1)
})

test('o recorte: a ferramenta chama a leitura pela porta com os valores fixos por cima do que o modelo mandou; uma versão nova dela não muda o publicado; a ligação perdida responde NOT_GRANTED', async (t) => {
  const asked = { page: 1, codigoEmpresa: 99, dataNegociacaoInicio: '01/11/2026' }
  const on = await agentsOn(t, [[tool(ORDERS, asked)], [], [tool(ORDERS, asked)], []])
  const inputs: unknown[] = []
  const door = on.hub.connectors.assistant
  const readBy = door.read.bind(door)
  door.read = (scope, a) => {
    inputs.push(a.input)
    return readBy(scope, a)
  }
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre as vendas.',
    tools: [orders.latest.id],
  })
  const next = await post(
    on.hub,
    on.ana,
    `${on.tools}/${orders.id}/versions`,
    {
      description: 'Os pedidos da empresa 2.',
      bound: { codigoEmpresa: 2 },
      open: ['page', 'dataNegociacaoInicio', 'dataNegociacaoFinal'],
      basedOn: 1,
    },
    randomUUID(),
  )
  assert.equal(next.statusCode, 201, next.body)
  const conversation = await talking(
    t,
    on.hub,
    on.ana,
    await talkedTo(on.hub, on.ana, on.agents, agent.id),
  )
  assert.equal(endOf(await conversation.say('Quanto vendemos?')), 'complete')
  assert.deepEqual(inputs, [{ page: 1, dataNegociacaoInicio: '01/11/2026', codigoEmpresa: 1 }])
  assert.equal(on.reads.length, 1, 'counted in the turn’s calls')

  const project = `${on.company}/projects/${on.projectId}`
  const taken = await call(on.hub, on.ana, 'DELETE', `${project}/connections/${on.matriz}`)
  assert.equal(taken.statusCode, 204, taken.body)
  assert.equal(endOf(await conversation.say('E agora?')), 'complete')
  assert.ok(on.calls.at(-1)?.texts.some((text) => text.includes('NOT_GRANTED')))
  assert.equal(inputs.length, 1)
})

test('a memória: desligada na versão, o turno lembra só as últimas 10 mensagens; ligada, lembra a conversa toda', async (t) => {
  const on = await agentsOn(t)
  async function window(observational: boolean) {
    const agent = await publishedAgent(on.hub, on.ana, on.agents, {
      instructions: 'Responda.',
      memory: { observational },
    })
    const conversation = await talking(
      t,
      on.hub,
      on.ana,
      await talkedTo(on.hub, on.ana, on.agents, agent.id),
    )
    for (let n = 1; n <= 7; n += 1) {
      assert.equal(endOf(await conversation.say(`Pergunta ${n}`)), 'complete')
    }
    return on.calls.at(-1)?.texts.filter((text) => text.startsWith('Pergunta ')) ?? []
  }
  const plain = await window(false)
  // The five turns before, ten messages, then the question.
  assert.deepEqual(plain, [
    'Pergunta 2',
    'Pergunta 3',
    'Pergunta 4',
    'Pergunta 5',
    'Pergunta 6',
    'Pergunta 7',
  ])
  const whole = await window(true)
  assert.equal(whole.length, 7)
})

test('a atualização: no settle, o turno de um agente termina antes do fim e uma conversa nova recebe HUB_UPDATING', {
  timeout: 60_000,
}, async (t) => {
  const held = holding(t)
  const on = await agentsOn(t, (asked) => title(asked) ?? held.reply)
  const agent = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  const stopping = await hubBeside(t, on.hub)
  const url = await talkedTo(stopping, on.ana, on.agents, agent.id)
  const other = await talkedTo(stopping, on.ana, on.agents, agent.id)
  const stream = await streamOf(stopping, on.ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(stopping, on.ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  const stopped = stopping.close(30_000)
  const refused = await sent(stopping, on.ana, other, 'Outra pergunta')
  assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'HUB_UPDATING'])
  held.release()
  assert.equal(endOf(await stream.turn()), 'complete')
  await stopped
})

/** Whether the conversation at `url` is still kept: Mastra's thread and the Hub's row leave together. */
async function kept(hub: Hub, url: string): Promise<boolean> {
  const id = url.slice(url.lastIndexOf('/') + 1)
  const found = await hub.test.mastraPool.query(
    'select count(*)::int as n from mastra.mastra_threads where id = $1',
    [id],
  )
  return found.rows[0]?.n === 1
}

test('a remoção: tirar a pessoa leva as conversas de agente dela; apagar o Projeto leva as de todas as pessoas', async (t) => {
  const on = await agentsOn(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const agent = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  const ana = await talkedTo(on.hub, on.ana, on.agents, agent.id)
  const theirs = await talkedTo(on.hub, carla, on.agents, agent.id, { draft: true })
  const removed = await call(on.hub, on.ana, 'DELETE', `${on.company}/members/${carla.id}`)
  assert.equal(removed.statusCode, 204, removed.body)
  assert.deepEqual([await kept(on.hub, ana), await kept(on.hub, theirs)], [true, false])
  const project = `${on.company}/projects/${on.projectId}`
  const gone = await call(on.hub, on.ana, 'DELETE', project, { name: 'Encomendas' })
  assert.equal(gone.statusCode, 204, gone.body)
  assert.equal(await kept(on.hub, ana), false)
})

test('a remoção: remover a empresa leva as conversas de agente de todas as pessoas dela', async (t) => {
  const on = await agentsOn(t)
  const agent = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  const urls = [
    await talkedTo(on.hub, on.ana, on.agents, agent.id),
    await talkedTo(on.hub, on.ana, on.agents, agent.id, { draft: true }),
  ]
  const operator = await personOn(on.hub, {
    name: 'Olga Souza',
    email: 'olga@example.test',
    role: 'admin',
  })
  await on.hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, '00000000000001', 'Empresa Teste Ltda', $1, now())`,
    [on.companyId],
  )
  const body = { name: 'Empresa Teste', revision: 0 }
  const deleted = await call(on.hub, operator, 'DELETE', `/api/clients/${on.companyId}`, body)
  assert.equal(deleted.statusCode, 204, deleted.body)
  for (const url of urls) assert.equal(await kept(on.hub, url), false, url)
})

test('a última execução: o turno da conversa de teste não muda lastRunAt; o do publicado grava o começo do turno, de qualquer pessoa, e o próximo o move', async (t) => {
  const on = await agentsOn(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const agent = await publishedAgent(on.hub, on.ana, on.agents, { instructions: 'Responda.' })
  async function lastRun() {
    const listed = await call(on.hub, on.ana, 'GET', `${on.company}/agents`)
    const rows: { id: string; lastRunAt: string | null }[] = Object(listed.json()).agents
    return rows.find((each) => each.id === agent.id)?.lastRunAt ?? null
  }
  assert.equal(await lastRun(), null)
  const test = await talking(
    t,
    on.hub,
    on.ana,
    await talkedTo(on.hub, on.ana, on.agents, agent.id, { draft: true }),
  )
  assert.equal(endOf(await test.say('Teste')), 'complete')
  assert.equal(await lastRun(), null, 'the test conversation does not count')

  const before = Date.now()
  const theirs = await talking(t, on.hub, carla, await talkedTo(on.hub, carla, on.agents, agent.id))
  assert.equal(endOf(await theirs.say('Quanto vendemos?')), 'complete')
  const first = await lastRun()
  assert.ok(
    first !== null && Date.parse(first) >= before - 1000,
    'written by another person’s turn',
  )
  assert.equal(endOf(await theirs.say('E ontem?')), 'complete')
  const second = await lastRun()
  assert.ok(second !== null && Date.parse(second) > Date.parse(first), 'the next turn moves it')
})
