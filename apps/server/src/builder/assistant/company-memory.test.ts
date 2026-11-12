import assert from 'node:assert/strict'
import { test } from 'node:test'
import { KNOWLEDGE_STORAGE_SCHEMA_VERSION } from '@mastra/core/knowledge'
import {
  BRUNO,
  CARLA,
  call,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../../hub/identity/test-hub.ts'
import { ATENDENTE } from '../../hub/identity/test-roles.ts'
import { endOf, KEY, MODEL } from '../conversation/test-conversation.ts'
import { stepped, tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'
import {
  instructed,
  memoryAt,
  memoryOf,
  NOTE,
  OPERATION_1100,
  savedThe1100,
} from './test-company-memory.ts'

const NO_SAVE =
  'You cannot save company memory here: say what an owner or an administrator should save.'

test('o formato do Knowledge: o armazenamento é o de versão 4, e as tabelas nascem no esquema do Mastra, pelo papel do Mastra', async (t) => {
  assert.equal(KNOWLEDGE_STORAGE_SCHEMA_VERSION, 4)
  const on = await assisting(t, [[tool('knowledge_list', {})], [said('Nada guardado.')]])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(
    endOf(await (await talking(t, on.hub, on.ana, url)).say('O que a empresa guardou?')),
    'complete',
  )
  assert.equal(on.calls.at(1)?.toolResults.at(0)?.error, false)
  const { rows } = await on.hub.test.mastraPool.query<{ schema: string; owner: string }>(
    `select schemaname as schema, tableowner as owner from pg_tables where tablename = 'mastra_knowledge_pages'`,
  )
  assert.deepEqual(rows, [{ schema: 'mastra', owner: 'mastra_runtime' }])
})

test('quem escreve, o bloco: o do dono e do administrador não diz nada; o do desenvolvedor, do membro e de um papel próprio diz que ele não guarda memória da empresa', async (t) => {
  const on = await assisting(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const dora = await memberOn(
    on.hub,
    on.companyId,
    { name: 'Dora Reis', email: 'dora@example.test' },
    'developer',
  )
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const eva = await memberOn(
    on.hub,
    on.companyId,
    { name: 'Eva Neves', email: 'eva@example.test' },
    'member',
  )
  const base = `/api/companies/${on.companyId}`
  assert.equal((await post(on.hub, on.ana, `${base}/roles`, ATENDENTE)).statusCode, 201)
  const given = await call(on.hub, on.ana, 'PUT', `${base}/members/${eva.id}`, {
    role: 'atendente',
    from: 'member',
  })
  assert.equal(given.statusCode, 200)
  const people = [
    ['owner', on.ana, false],
    ['admin', carla, false],
    ['developer', dora, true],
    ['member', bruno, true],
    ['atendente', eva, true],
  ] as const
  for (const [at, [role, person, refused]] of people.entries()) {
    const url = await created(on.hub, person, on.assistant, { connections: [] })
    assert.equal(endOf(await (await talking(t, on.hub, person, url)).say('Oi')), 'complete')
    const block = on.calls.at(at)?.systems.at(1)?.text ?? ''
    assert.equal(block.includes(NO_SAVE), refused, role)
  }
})

const RULE = 'Responda sempre citando o número da operação.'

test('as instruções valem para a empresa toda: gravadas pela tela, estão em todo pedido de toda conversa da empresa, depois da mensagem fixa, que não muda', async (t) => {
  const on = await assisting(t, [
    [said('Oi.')],
    [tool('knowledge_read', {})],
    [said('Pronto.')],
    [said('Oi, Bruno.')],
  ])
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const before = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, before)).say('Oi')), 'complete')
  await instructed(on.hub, on.ana, on.companyId, RULE)
  for (const person of [on.ana, bruno]) {
    const url = await created(on.hub, person, on.assistant, { connections: [] })
    assert.equal(endOf(await (await talking(t, on.hub, person, url)).say('Oi')), 'complete')
  }
  assert.equal(on.calls.length, 4)
  const [first, ...after] = on.calls
  assert.equal(
    first?.texts.some((text) => text.includes(RULE)),
    false,
  )
  for (const asked of after) {
    assert.equal(asked.texts.filter((text) => text.includes(RULE)).length, 1)
    assert.equal(asked.systems.at(0)?.text, first?.systems.at(0)?.text)
  }
})

test('não passam de empresa: a conversa de outra empresa não recebe as instruções nem enxerga a memória desta', async (t) => {
  const on = await assisting(t, [[tool('knowledge_read', {})], [said('Nada.')]])
  await instructed(on.hub, on.ana, on.companyId, RULE)
  const carla = await personOn(on.hub, CARLA)
  const other = await plantCompany(on.hub.test, carla.id, 'Outra')
  const company = `/api/companies/${other}`
  const account = { owner: 'company', provider: 'anthropic', label: 'Outra', key: KEY }
  assert.equal((await post(on.hub, carla, `${company}/model-accounts`, account)).statusCode, 201)
  const model = { model: MODEL, effort: 'off' }
  assert.equal(
    (await call(on.hub, carla, 'PUT', `${company}/default-model`, model)).statusCode,
    200,
  )
  const url = await created(on.hub, carla, `${company}/assistant/conversations`, {
    connections: [],
  })
  assert.equal(endOf(await (await talking(t, on.hub, carla, url)).say('Oi')), 'complete')
  for (const asked of on.calls) assert.equal(asked.texts.join('\n').includes(RULE), false)
  const read = JSON.parse(on.calls.at(1)?.toolResults.at(0)?.text ?? '{}')
  assert.deepEqual(read, { scopes: [{ address: `org:${other}`, name: `org:${other}` }] })
})

test('o membro lê: a página que o dono salvou está na tela e no Knowledge da conversa de um membro', async (t) => {
  let scope = ''
  const on = await assisting(
    t,
    stepped([
      () => [tool('knowledge_read', {})],
      (asked) => {
        scope = String(JSON.parse(asked.toolResults.at(-1)?.text ?? '{}').scopes.at(0).address)
        return [tool('knowledge_read', { page: scope })]
      },
      (asked) => {
        const { children } = JSON.parse(asked.toolResults.at(-1)?.text ?? '{}')
        const page = children.find((each: { name: string }) => each.name === OPERATION_1100.name)
        return [tool('knowledge_read', { page: page.ref })]
      },
      () => [said('A 1100 é a venda à vista.')],
    ]),
  )
  await savedThe1100(on.hub, on.ana, on.companyId)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const url = await created(on.hub, bruno, on.assistant, { connections: [] })
  assert.equal(
    endOf(await (await talking(t, on.hub, bruno, url)).say('O que é a 1100?')),
    'complete',
  )
  const read = JSON.parse(on.calls.at(-1)?.toolResults.at(-1)?.text ?? '{}')
  assert.equal(read.page.body, OPERATION_1100.body)
  assert.deepEqual(
    read.notes.map((each: { text: string }) => each.text),
    [NOTE],
  )
  const memory = await memoryOf(on.hub, bruno, on.companyId)
  assert.equal(memory.mayManage, false)
  const pageId = memory.pages.at(0).pageId
  const shown = await call(on.hub, bruno, 'GET', `${memoryAt(on.companyId)}/pages/${pageId}`)
  assert.equal(shown.statusCode, 200, shown.body)
  const { page } = Object(shown.json())
  assert.deepEqual(
    [page.body, page.notes.map((each: { body: string }) => each.body)],
    [OPERATION_1100.body, [NOTE]],
  )
})
