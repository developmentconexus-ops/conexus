import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import {
  BRUNO,
  CARLA,
  call,
  codeOf,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../../hub/identity/test-hub.ts'
import { KEY, MODEL } from '../conversation/test-conversation.ts'
import { assisting, created } from './test-assistant.ts'

/**
 * Whether the conversation at `url` is still kept: Mastra's thread and the Hub's row of its choice
 * leave together (data D17).
 */
async function kept(hub: Hub, url: string): Promise<boolean> {
  const id = url.slice(url.lastIndexOf('/') + 1)
  const found = await hub.test.mastraPool.query(
    'select count(*)::int as n from mastra.mastra_threads where id = $1',
    [id],
  )
  const [row] = await hub.test.asOwner(
    'select count(*)::int as n from builder.assistant_conversation where id = $1',
    [id],
  )
  const thread = found.rows[0]?.n === 1
  assert.equal(Object(row).n === 1, thread, `the thread and the choice of ${id} leave together`)
  return thread
}

/** Another company, owned by `person`, with a model account and the default model; its Assistant's conversations. */
async function otherCompany(hub: Hub, person: Person) {
  const companyId = await plantCompany(hub.test, person.id, 'Outra Empresa')
  const company = `/api/companies/${companyId}`
  const body = { owner: 'company', provider: 'anthropic', label: 'Time', key: KEY }
  assert.equal((await post(hub, person, `${company}/model-accounts`, body)).statusCode, 201)
  const model = { model: MODEL, effort: 'off' }
  assert.equal((await call(hub, person, 'PUT', `${company}/default-model`, model)).statusCode, 200)
  return `${company}/assistant/conversations`
}

/** Ana's and Carla's conversations of the Assistant, on the Início and in the Projeto, and one of another company. */
async function spread(t: TestContext) {
  const on = await assisting(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const inProject = { projectId: on.projectId, connections: [] }
  const home = { connections: [] }
  const urls = {
    anaHome: await created(on.hub, on.ana, on.assistant, home),
    anaProject: await created(on.hub, on.ana, on.assistant, inProject),
    carlaHome: await created(on.hub, carla, on.assistant, home),
    carlaProject: await created(on.hub, carla, on.assistant, inProject),
    elsewhere: await created(on.hub, carla, await otherCompany(on.hub, carla), home),
  }
  async function left() {
    const entries = await Promise.all(
      Object.entries(urls).map(async ([name, url]) => [name, await kept(on.hub, url)] as const),
    )
    return Object.fromEntries(entries)
  }
  return { ...on, carla, urls, left }
}

test('tirar uma pessoa apaga as conversas dela do Assistente, e nenhuma outra', async (t) => {
  const on = await spread(t)
  const removed = await call(on.hub, on.ana, 'DELETE', `${on.company}/members/${on.carla.id}`)
  assert.equal(removed.statusCode, 204, removed.body)
  assert.deepEqual(await on.left(), {
    anaHome: true,
    anaProject: true,
    carlaHome: false,
    carlaProject: false,
    elsewhere: true,
  })
})

test('remover a empresa apaga as conversas do Assistente de todas as pessoas dela, e nenhuma de outra empresa', async (t) => {
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
  assert.deepEqual(await on.left(), {
    anaHome: false,
    anaProject: false,
    carlaHome: false,
    carlaProject: false,
    elsewhere: true,
  })
})

test('o Projeto: apagá-lo apaga as conversas presas a ele, de todas as pessoas, também mais de 100; o Mastra fora deixa o Projeto marcado, e a repetição acha as que sobraram', async (t) => {
  const on = await spread(t)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'admin')
  const many: string[] = []
  for (let n = 0; n < 101; n += 1) {
    many.push(
      await created(on.hub, bruno, on.assistant, { projectId: on.projectId, connections: [] }),
    )
  }
  const project = `${on.company}/projects/${on.projectId}`
  await on.hub.test.mastraPool.query(
    'alter table mastra.mastra_threads rename to mastra_threads_out',
  )
  const pending = await call(on.hub, on.ana, 'DELETE', project, { name: 'Encomendas' })
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'PROJECT_DELETION_PENDING'])
  await on.hub.test.mastraPool.query(
    'alter table mastra.mastra_threads_out rename to mastra_threads',
  )
  assert.ok(await kept(on.hub, on.urls.anaProject))

  const resumed = await call(on.hub, on.ana, 'DELETE', project, { name: 'Encomendas' })
  assert.equal(resumed.statusCode, 204, resumed.body)
  assert.deepEqual(await on.left(), {
    anaHome: true,
    anaProject: false,
    carlaHome: true,
    carlaProject: false,
    elsewhere: true,
  })
  for (const url of many) assert.equal(await kept(on.hub, url), false, url)
})
