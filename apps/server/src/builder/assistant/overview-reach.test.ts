import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ASSISTANT_TOOL } from '@conexus/hub-api'
import { sankhyaFake } from '../../hub/connectors/test-sales.ts'
import { releasing } from '../../hub/copies/test-released.ts'
import { BRUNO, call, memberOn, post } from '../../hub/identity/test-hub.ts'
import { ATENDENTE } from '../../hub/identity/test-roles.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

async function world(t: TestContext) {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const on = await assisting(t, [[tool(ASSISTANT_TOOL.overview, {})], [said('Veja.')]], {
    origin: served.origin,
    matriz: fake.credential,
    filial: fake.credential,
  })
  const copies = await releasing(t, on, { connectionId: on.matriz }, ['vendas'])
  return { on, copies }
}

async function roleOf(w: Awaited<ReturnType<typeof world>>, body: object, copy?: string) {
  const { hub, ana, companyId } = w.on
  const made = await post(hub, ana, `/api/companies/${companyId}/roles`, body)
  assert.equal(made.statusCode, 201, made.body)
  const role = String(Object(made.json()).role.role)
  if (copy !== undefined) {
    const id = w.copies.ids.get(copy)
    assert.ok(id)
    const marked = await call(hub, ana, 'PUT', `/api/companies/${companyId}/roles/${role}/copies`, {
      copies: [id],
    })
    assert.equal(marked.statusCode, 200, marked.body)
  }
  return memberOn(hub, companyId, BRUNO, role)
}

async function overviewFor(t: TestContext, w: Awaited<ReturnType<typeof world>>, who = w.on.ana) {
  const url = await created(w.on.hub, who, w.on.assistant, {
    connections: [w.on.matriz, w.on.filial],
  })
  assert.equal(endOf(await (await talking(t, w.on.hub, who, url)).say('Resuma')), 'complete')
  return JSON.parse(String(w.on.calls.at(1)?.texts.findLast((text) => text.includes('projects'))))
}

function names(seen: { connections: { name: string }[] }) {
  return seen.connections.map((each) => each.name)
}

test('o resumo não lista a conexão de um sistema que o papel não alcança: sem tabela e sem operação, nenhuma; o dono vê as duas', async (t) => {
  const w = await world(t)
  const bruno = await roleOf(w, { label: 'Vazio', connectors: {} })
  assert.deepEqual(names(await overviewFor(t, w, bruno)), [])
  const owner = await world(t)
  assert.deepEqual(names(await overviewFor(t, owner)), ['Matriz', 'Filial'])
})

test('o resumo lista a conexão que o papel alcança por uma operação ao vivo', async (t) => {
  const w = await world(t)
  const bruno = await roleOf(w, ATENDENTE)
  assert.deepEqual(names(await overviewFor(t, w, bruno)), ['Matriz', 'Filial'])
})

test('o resumo lista só a conexão de onde vem a tabela que o papel lê, sem operação ao vivo', async (t) => {
  const w = await world(t)
  const bruno = await roleOf(w, { label: 'Leitor', connectors: {} }, 'vendas')
  assert.deepEqual(names(await overviewFor(t, w, bruno)), ['Matriz'])
})
