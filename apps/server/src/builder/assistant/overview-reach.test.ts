import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ASSISTANT_TOOL } from '@conexus/hub-api'
import { endOf } from '../../harness/routes/test-conversation.ts'
import { tool } from '../../harness/routes/test-questions.ts'
import { sankhyaFake } from '../../hub/connectors/test-sales.ts'
import { BRUNO, memberOn, post } from '../../hub/identity/test-hub.ts'
import { ATENDENTE } from '../../hub/identity/test-roles.ts'
import { assisting, created, runOverviewOnSilentHub, said, talking } from './test-assistant.ts'

async function world(t: TestContext) {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const on = await assisting(t, [[tool(ASSISTANT_TOOL.overview, {})], [said('Veja.')]], {
    origin: served.origin,
    matriz: fake.credential,
    filial: fake.credential,
  })
  return { on }
}

async function roleOf(w: Awaited<ReturnType<typeof world>>, body: object) {
  const { hub, ana, companyId } = w.on
  const made = await post(hub, ana, `/api/companies/${companyId}/roles`, body)
  assert.equal(made.statusCode, 201, made.body)
  const role = String(Object(made.json()).role.role)
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

test('o resumo não lista a conexão de um sistema que o papel não alcança: sem operação, nenhuma; o dono vê as duas', async (t) => {
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

test('o Hub calado: o catálogo indisponível faz a ferramenta falhar, nunca listar nenhuma conexão', async () => {
  await assert.rejects(
    runOverviewOnSilentHub(),
    (error) => Object(error).code === 'DATABASE_UNAVAILABLE',
  )
})
