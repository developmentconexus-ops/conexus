import assert from 'node:assert/strict'
import { test } from 'node:test'
import { KNOWLEDGE_STORAGE_SCHEMA_VERSION } from '@mastra/core/knowledge'
import { BRUNO, CARLA, call, memberOn, post } from '../../hub/identity/test-hub.ts'
import { ATENDENTE } from '../../hub/identity/test-roles.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

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

test('quem escreve: o bloco do dono e do administrador não diz nada; o do desenvolvedor, do membro e de um papel próprio diz que ele não guarda memória da empresa', async (t) => {
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
