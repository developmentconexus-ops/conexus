import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { AgentId, CompanyId, ConversationId, PersonId, ProjectId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import {
  CARLA,
  call,
  codeOf,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../../hub/identity/test-hub.ts'
import {
  agentOf,
  agentsOn,
  drafted,
  madeAgent,
  madeTool,
  ordersOf,
  otherProject,
  publishedAgent,
  talkedTo,
  toolOf,
} from './test-agents.ts'

type Event = { kind: string; agentId: string }

/** Ana's and Carla's published agents on one tool of Carla's, and an agent of another company. */
async function spread(t: TestContext) {
  const on = await agentsOn(t)
  const events: Event[] = []
  on.hub.agents.onChange(async (event) => {
    events.push({ kind: event.kind, agentId: event.agentId })
  })
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const tool = await madeTool(on.hub, carla, on.tools, ordersOf(on.matriz))
  async function published(person: Person, agents: string, name: string, tools: string[]) {
    const made = await madeAgent(on.hub, person, agents, name)
    const chosen = await drafted(on.hub, person, agents, made, { instructions: name, tools })
    const done = await post(on.hub, person, `${agents}/${made.id}/publish`, {
      revision: chosen.revision,
      message: '',
    })
    assert.equal(done.statusCode, 200, done.body)
    return agentOf(done).id
  }
  const elsewhere = await plantCompany(on.hub.test, carla.id, 'Outra Empresa')
  const project = await post(on.hub, carla, `/api/companies/${elsewhere}/projects`, {
    name: 'Filial Sul',
  })
  assert.equal(project.statusCode, 201, project.body)
  const there = `/api/companies/${elsewhere}/projects/${Object(project.json()).project.id}/agents`
  const ids = {
    ana: await published(on.ana, on.agents, 'Vendas do dia', [tool.latest.id]),
    carla: await published(carla, on.agents, 'Estoque', [tool.latest.id]),
    elsewhere: (await madeAgent(on.hub, carla, there, 'Lá')).id,
  }
  async function left() {
    const rows = await on.hub.test.asOwner(
      `select a.id,
        (select count(*)::int from builder.agent_version v where v.agent_id = a.id) as versions,
        (select count(*)::int from builder.agent_tool c where c.agent_id = a.id) as chosen
       from builder.agent a`,
    )
    const found = new Map(rows.map((row) => [row.id, [row.versions, row.chosen]]))
    return Object.fromEntries(
      Object.entries(ids).map(([name, id]) => [name, found.get(id) ?? null]),
    )
  }
  async function toolsLeft() {
    const rows = await on.hub.test.asOwner(
      `select t.company_id, count(v.id)::int as versions from builder.tool t
        join builder.tool_version v on v.tool_id = t.id group by t.company_id`,
    )
    return rows.map((row) => [row.company_id === on.companyId, row.versions])
  }
  function at(message: string) {
    return on.lines.findIndex((line) => line.message === message)
  }
  return { ...on, carla, tool, elsewhere, ids, events, left, toolsLeft, at }
}

test('apagar: 204, o agente, as versões e as escolhas somem e a ferramenta fica; de novo, AGENT_NOT_FOUND', async (t) => {
  const on = await spread(t)
  const url = `${on.agents}/${on.ids.ana}`
  const gone = await call(on.hub, on.ana, 'DELETE', url)
  assert.equal(gone.statusCode, 204, gone.body)
  assert.deepEqual(await on.left(), { ana: null, carla: [1, 1], elsewhere: [0, 0] })
  assert.deepEqual(await on.toolsLeft(), [[true, 1]])
  assert.deepEqual(on.events.at(-1), { kind: 'DELETED', agentId: on.ids.ana })
  const again = await call(on.hub, on.ana, 'DELETE', url)
  assert.deepEqual([again.statusCode, codeOf(again)], [404, 'AGENT_NOT_FOUND'])
  const tool = toolOf(await call(on.hub, on.ana, 'GET', `${on.tools}/${on.tool.id}`))
  assert.deepEqual(tool.usedBy, [{ id: on.ids.carla, name: 'Estoque' }])
})

test('a pessoa: tirar a Carla deixa os agentes, as versões e as ferramentas dela, sem autor', async (t) => {
  const on = await spread(t)
  const removed = await call(on.hub, on.ana, 'DELETE', `${on.company}/members/${on.carla.id}`)
  assert.equal(removed.statusCode, 204, removed.body)
  assert.deepEqual(await on.left(), { ana: [1, 1], carla: [1, 1], elsewhere: [0, 0] })
  const url = `${on.agents}/${on.ids.carla}`
  assert.equal(agentOf(await call(on.hub, on.ana, 'GET', url)).createdBy, null)
  const versions = Object((await call(on.hub, on.ana, 'GET', `${url}/versions`)).json()).versions
  assert.deepEqual(
    versions.map((each: { publishedBy: unknown }) => each.publishedBy),
    [null],
  )
  const authors = await on.hub.test.asOwner(
    `select (select count(*)::int from builder.tool where created_by = $1) as tools,
       (select count(*)::int from builder.tool_version where created_by = $1) as versions`,
    [on.carla.id],
  )
  assert.deepEqual(authors, [{ tools: 0, versions: 0 }])
  assert.deepEqual(await on.toolsLeft(), [[true, 1]])
})

test('o Projeto: apagá-lo leva os agentes dele depois das automações e antes das conversas, e as ferramentas da empresa ficam', async (t) => {
  const on = await spread(t)
  const project = `${on.company}/projects/${on.projectId}`
  const gone = await call(on.hub, on.ana, 'DELETE', project, { name: 'Encomendas' })
  assert.equal(gone.statusCode, 204, gone.body)
  assert.deepEqual(await on.left(), { ana: null, carla: null, elsewhere: [0, 0] })
  assert.deepEqual(await on.toolsLeft(), [[true, 1]])
  assert.ok(on.at('AUTOMATIONS_RELEASED') < on.at('AGENTS_RELEASED'))
  assert.ok(on.at('AGENTS_RELEASED') < on.at('CONVERSATIONS_RELEASED'))
  assert.deepEqual(
    on.events
      .filter((each) => each.kind === 'DELETED')
      .map((each) => each.agentId)
      .sort(),
    [on.ids.ana, on.ids.carla].sort(),
  )
})

test('a empresa: removê-la leva os agentes e as ferramentas dela, e nada de outra empresa', async (t) => {
  const on = await spread(t)
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
  assert.deepEqual(await on.left(), { ana: null, carla: null, elsewhere: [0, 0] })
  assert.deepEqual(await on.toolsLeft(), [])
  assert.ok(on.at('AGENTS_RELEASED') < on.at('CONVERSATIONS_RELEASED'))
})

test('as chaves: a política da empresa não lê o agente de outra; companies_with_agents só executa por hub_runtime e só dá as empresas com um agente publicado', async (t) => {
  const on = await spread(t)
  async function seenBy(companyId: string) {
    const scope = {
      kind: 'COMPANY',
      companyId: CompanyId.parse(companyId),
      personId: null,
    } as const
    const read = await on.hub.test.database.read(scope, (tx) =>
      tx.execute(sql`select id from builder.agent where id = ${on.ids.ana}`),
    )
    return read.rows
  }
  assert.deepEqual(await seenBy(on.companyId), [{ id: on.ids.ana }])
  assert.deepEqual(await seenBy(on.elsewhere), [])
  const allowed = await on.hub.test.asOwner(
    `select r.rolname from pg_roles r
      where has_function_privilege(r.oid, 'builder.companies_with_agents()', 'execute')
        and r.rolname in ('hub_runtime', 'hub_company', 'hub_installation', 'mastra_runtime')`,
  )
  assert.deepEqual(
    allowed.map((row) => row.rolname),
    ['hub_runtime'],
  )
  const companies = await on.hub.test.database.installationRead((tx) =>
    tx.execute(sql`select company_id from builder.companies_with_agents()`),
  )
  assert.deepEqual(companies.rows, [{ company_id: on.companyId }])
  const live = await on.hub.agents.publishedAll()
  assert.deepEqual(
    live.map((each) => [each.companyId, each.agentId]).sort(),
    [
      [on.companyId, on.ids.ana],
      [on.companyId, on.ids.carla],
    ].sort(),
  )
})

/** Whether a conversation's thread and its row are kept, as a pair: never a thread without its row. */
async function pairOf(hub: Hub, id: string) {
  const threads = await hub.test.mastraPool.query(
    'select count(*)::int as n from mastra.mastra_threads where id = $1',
    [id],
  )
  const [row] = await hub.test.asOwner(
    'select count(*)::int as n from builder.agent_conversation where id = $1',
    [id],
  )
  return [threads.rows[0]?.n, Object(row).n]
}

test('as conversas: apagar o agente leva as de todas as pessoas nas três ordens, a linha antes da primeira varredura, entre ela e o delete, e depois; nenhum fio fica sem a linha', async (t) => {
  const on = await spread(t)
  const agentId = AgentId.parse(on.ids.ana)
  const before = await talkedTo(on.hub, on.carla, on.agents, agentId)
  const scope = {
    companyId: CompanyId.parse(on.companyId),
    projectId: ProjectId.parse(on.projectId),
    personId: PersonId.parse(on.ana.id),
  }
  const frozen = await on.hub.agents.draftOf(scope, agentId)
  const between: string[] = []
  on.hub.agents.onChange(async (event) => {
    if (event.kind !== 'DELETING') return
    between.push(await talkedTo(on.hub, on.ana, on.agents, agentId, { draft: true }))
  })
  const gone = await call(on.hub, on.ana, 'DELETE', `${on.agents}/${agentId}`)
  assert.equal(gone.statusCode, 204, gone.body)
  const after = ConversationId.parse(randomUUID())
  await assert.rejects(on.hub.agents.open({ scope, agentId, draft: true, frozen, id: after }), {
    code: 'AGENT_NOT_FOUND',
  })
  const ids = [before, ...between].map((url) => url.slice(url.lastIndexOf('/') + 1))
  assert.equal(ids.length, 2)
  for (const id of [...ids, after]) assert.deepEqual(await pairOf(on.hub, id), [0, 0], id)
})

test('outro Projeto: apagar pelo endereço do Projeto A o agente do Projeto B dá AGENT_NOT_FOUND sem efeito; a conversa da Carla fica e o agente responde', async (t) => {
  const on = await spread(t)
  const vendas = await otherProject(on.hub, on.ana, on.company, [])
  const there = await publishedAgent(on.hub, on.ana, vendas.agents, {
    instructions: 'Responda sobre as vendas.',
  })
  const talk = await talkedTo(on.hub, on.carla, vendas.agents, there.id)
  const id = talk.slice(talk.lastIndexOf('/') + 1)
  const seen = on.events.length
  const crossed = await call(on.hub, on.ana, 'DELETE', `${on.agents}/${there.id}`)
  assert.deepEqual([crossed.statusCode, codeOf(crossed)], [404, 'AGENT_NOT_FOUND'])
  assert.deepEqual(on.events.slice(seen), [])
  assert.deepEqual(await pairOf(on.hub, id), [1, 1])
  const still = await call(on.hub, on.ana, 'GET', `${vendas.agents}/${there.id}`)
  assert.equal(still.statusCode, 200, still.body)
})

test('o corte: um agente cuja linha saiu antes da segunda varredura é varrido pela próxima remoção, que dá AGENT_NOT_FOUND; nenhum fio fica sem a linha', async (t) => {
  const on = await spread(t)
  const talk = await talkedTo(on.hub, on.carla, on.agents, AgentId.parse(on.ids.ana))
  const id = talk.slice(talk.lastIndexOf('/') + 1)
  await on.hub.test.asOwner('delete from builder.agent where id = $1', [on.ids.ana])
  assert.deepEqual(await pairOf(on.hub, id), [1, 0])
  const again = await call(on.hub, on.ana, 'DELETE', `${on.agents}/${on.ids.ana}`)
  assert.deepEqual([again.statusCode, codeOf(again)], [404, 'AGENT_NOT_FOUND'])
  assert.deepEqual(await pairOf(on.hub, id), [0, 0])
})
