import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { COMPANY_INSTRUCTIONS_MAX } from '@conexus/hub-api'
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
import { assisting } from './test-assistant.ts'
import { memoryAt, memoryOf, NOTE, OPERATION_1100, savedThe1100 } from './test-company-memory.ts'

/** Empresa Teste with the 1100 Ana saved from a proposal's card; Bruno a member, Carla an administrator. */
async function saved(t: TestContext) {
  const on = await assisting(t)
  await savedThe1100(on.hub, on.ana, on.companyId)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const memory = memoryAt(on.companyId)
  const { pageId } = (await memoryOf(on.hub, on.ana, on.companyId)).pages.at(0)
  const read = await call(on.hub, on.ana, 'GET', `${memory}/pages/${pageId}`)
  const { page } = Object(read.json())
  return { ...on, bruno, carla, memory, page, pagePath: `${memory}/pages/${pageId}` }
}

test('as rotas: todo membro lista e lê; gravar e apagar pedem a permissão Memória da empresa', async (t) => {
  const on = await saved(t)
  const listed = await memoryOf(on.hub, on.bruno, on.companyId)
  assert.equal(listed.mayManage, false)
  assert.deepEqual(
    listed.pages.map((each: { name: string }) => each.name),
    [OPERATION_1100.name],
  )
  assert.equal((await memoryOf(on.hub, on.carla, on.companyId)).mayManage, true)
  const read = await call(on.hub, on.bruno, 'GET', on.pagePath)
  assert.equal(read.statusCode, 200, read.body)
  assert.deepEqual(Object(read.json()).page, on.page)

  const change = { name: 'Venda', body: 'Outro texto.', version: on.page.version }
  const note = `${on.memory}/notes/${on.page.notes.at(0).id}`
  for (const [method, url, body] of [
    ['PUT', on.pagePath, change],
    ['DELETE', `${on.pagePath}?version=${on.page.version}`, undefined],
    ['PUT', note, { body: 'Outra nota.' }],
    ['DELETE', note, undefined],
  ] as const) {
    const refused = await call(on.hub, on.bruno, method, url, body)
    assert.equal(refused.statusCode, 409, refused.body)
    assert.equal(codeOf(refused), 'NOT_IN_ROLE')
  }
  assert.deepEqual(Object((await call(on.hub, on.ana, 'GET', on.pagePath)).json()).page, on.page)
})

test('as rotas: as instruções vão até 2.000 caracteres e não se apagam', async (t) => {
  const on = await saved(t)
  const { instructions } = await memoryOf(on.hub, on.ana, on.companyId)
  const path = `${on.memory}/pages/${instructions.pageId}`
  const long = { name: instructions.name, version: instructions.version }
  const over = await call(on.hub, on.ana, 'PUT', path, {
    ...long,
    body: 'a'.repeat(COMPANY_INSTRUCTIONS_MAX + 1),
  })
  assert.equal(over.statusCode, 400, over.body)
  assert.equal(codeOf(over), 'REQUEST_MALFORMED')
  const at = await call(on.hub, on.carla, 'PUT', path, {
    ...long,
    body: 'a'.repeat(COMPANY_INSTRUCTIONS_MAX),
  })
  assert.equal(at.statusCode, 200, at.body)
  assert.equal(Object(at.json()).page.author, CARLA.name)
  const removed = await call(on.hub, on.ana, 'DELETE', `${path}?version=${instructions.version}`)
  assert.equal(removed.statusCode, 400, removed.body)
  assert.equal(codeOf(removed), 'REQUEST_MALFORMED')
})

test('as rotas: apagar ou gravar com outra gravação no meio volta COMPANY_MEMORY_CHANGED, e nada se perde', async (t) => {
  const on = await saved(t)
  const first = { name: 'Venda à vista', body: 'Corrigido pela Carla.', version: on.page.version }
  const corrected = await call(on.hub, on.carla, 'PUT', on.pagePath, first)
  assert.equal(corrected.statusCode, 200, corrected.body)
  const { page } = Object(corrected.json())
  assert.deepEqual([page.name, page.body, page.author], [first.name, first.body, CARLA.name])

  const stale = await call(on.hub, on.ana, 'DELETE', `${on.pagePath}?version=${on.page.version}`)
  assert.equal(stale.statusCode, 409, stale.body)
  assert.equal(codeOf(stale), 'COMPANY_MEMORY_CHANGED')
  const late = { name: 'Venda', body: 'Da Ana.', version: on.page.version }
  const overwritten = await call(on.hub, on.ana, 'PUT', on.pagePath, late)
  assert.equal(overwritten.statusCode, 409, overwritten.body)
  assert.equal(codeOf(overwritten), 'COMPANY_MEMORY_CHANGED')
  assert.equal(
    Object((await call(on.hub, on.ana, 'GET', on.pagePath)).json()).page.body,
    first.body,
  )

  const removed = await call(on.hub, on.ana, 'DELETE', `${on.pagePath}?version=${page.version}`)
  assert.equal(removed.statusCode, 204, removed.body)
  assert.equal((await call(on.hub, on.ana, 'GET', on.pagePath)).statusCode, 404)
  assert.deepEqual((await memoryOf(on.hub, on.ana, on.companyId)).pages, [])
})

test('as rotas: as notas se corrigem e se apagam, com o autor', async (t) => {
  const on = await saved(t)
  const [held] = on.page.notes
  assert.deepEqual([held.body, held.author], [NOTE, 'Ana Lima'])
  const note = `${on.memory}/notes/${held.id}`
  const corrected = await call(on.hub, on.ana, 'PUT', note, { body: 'Vale desde março.' })
  assert.equal(corrected.statusCode, 200, corrected.body)
  const written = Object(corrected.json()).note
  assert.deepEqual([written.body, written.author], ['Vale desde março.', 'Ana Lima'])
  assert.notEqual(written.id, held.id)
  const notes = Object((await call(on.hub, on.bruno, 'GET', on.pagePath)).json()).page.notes
  assert.deepEqual(
    notes.map((each: { id: string; body: string }) => [each.id, each.body]),
    [[written.id, 'Vale desde março.']],
  )
  assert.equal((await call(on.hub, on.ana, 'PUT', note, { body: 'De novo.' })).statusCode, 404)
  const again = `${on.memory}/notes/${written.id}`
  assert.equal((await call(on.hub, on.carla, 'DELETE', again)).statusCode, 204)
  assert.equal((await call(on.hub, on.carla, 'DELETE', again)).statusCode, 404)
  assert.deepEqual(Object((await call(on.hub, on.ana, 'GET', on.pagePath)).json()).page.notes, [])
})

test('as rotas: outra empresa não acha a página nem a nota, e quem não é membro não lista', async (t) => {
  const on = await saved(t)
  const other = await plantCompany(on.hub.test, on.carla.id, 'Outra')
  const theirs = memoryAt(other)
  const pageId = on.page.pageId
  const noteId = on.page.notes.at(0).id
  const change = { name: 'Venda', body: 'De fora.', version: on.page.version }
  for (const [method, url, body] of [
    ['GET', `${theirs}/pages/${pageId}`, undefined],
    ['PUT', `${theirs}/pages/${pageId}`, change],
    ['DELETE', `${theirs}/pages/${pageId}?version=${on.page.version}`, undefined],
    ['PUT', `${theirs}/notes/${noteId}`, { body: 'De fora.' }],
    ['DELETE', `${theirs}/notes/${noteId}`, undefined],
  ] as const) {
    const refused = await call(on.hub, on.carla, method, url, body)
    assert.equal(refused.statusCode, 404, `${method} ${url} ${refused.body}`)
    assert.equal(codeOf(refused), 'NOT_FOUND')
  }
  const noted = await post(on.hub, on.carla, `${theirs}/pages/${pageId}/notes`, {
    body: 'De fora.',
  })
  assert.deepEqual([noted.statusCode, codeOf(noted)], [404, 'NOT_FOUND'], noted.body)
  assert.deepEqual((await memoryOf(on.hub, on.carla, other)).pages, [])
  const davi = await personOn(on.hub, { name: 'Davi Cruz', email: 'davi@example.test' })
  const outsider = await call(on.hub, davi, 'GET', on.memory)
  assert.equal(outsider.statusCode, 404, outsider.body)
  assert.deepEqual(Object((await call(on.hub, on.ana, 'GET', on.pagePath)).json()).page, on.page)
})
