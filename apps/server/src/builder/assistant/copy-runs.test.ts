import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ASSISTANT_TOOL } from '@conexus/hub-api'
import { sankhyaFake } from '../../hub/connectors/test-sales.ts'
import { SANKHYA_REFUSED } from '../../hub/copies/test-copies.ts'
import { releasing } from '../../hub/copies/test-released.ts'
import { BRUNO, call, memberOn, post } from '../../hub/identity/test-hub.ts'
import { ATENDENTE } from '../../hub/identity/test-roles.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'
import { copyGoneBetween } from './test-copy-runs.ts'

function ask(table: string) {
  return [[tool(ASSISTANT_TOOL.copyRuns, { table })], [said('Pronto.')]]
}

async function copyWorld(t: TestContext, steps: ReturnType<typeof ask>) {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const on = await assisting(t, steps, {
    origin: served.origin,
    matriz: fake.credential,
    filial: fake.credential,
  })
  const world = await releasing(t, on, { connectionId: on.matriz }, ['vendas', 'clientes'])
  return { on, fake, ...world }
}

type World = Awaited<ReturnType<typeof copyWorld>>

function refusedRun(w: World, name: string, signal = AbortSignal.timeout(60_000)) {
  const copyId = w.ids.get(name)
  assert.ok(copyId, name)
  return w.on.hub.copies.run({ companyId: w.companyId, copyId }, signal)
}

async function conversation(t: TestContext, w: World, who = w.on.ana) {
  const url = await created(w.on.hub, who, w.on.assistant, { connections: [] })
  const { say } = await talking(t, w.on.hub, who, url)
  return () => say('Por que a cópia parou?')
}

async function turn(t: TestContext, w: World, who = w.on.ana) {
  await (await conversation(t, w, who))()
}

function resultsOf(w: World) {
  return w.on.calls.at(-1)?.toolResults ?? []
}

async function readerOfVendas(w: World) {
  const { hub, ana, companyId } = w.on
  const made = await post(hub, ana, `/api/companies/${companyId}/roles`, ATENDENTE)
  assert.equal(made.statusCode, 201, made.body)
  const role = String(Object(made.json()).role.role)
  const vendas = w.ids.get('vendas')
  assert.ok(vendas)
  const marked = await call(hub, ana, 'PUT', `/api/companies/${companyId}/roles/${role}/copies`, {
    copies: [vendas],
  })
  assert.equal(marked.statusCode, 200, marked.body)
  return memberOn(hub, companyId, BRUNO, role)
}

test('a causa de uma cópia parada', async (t) => {
  const w = await copyWorld(t, ask('sankhya_vendas'))
  w.fake.switches.refuse.add('consultar')
  await refusedRun(w, 'vendas')
  await turn(t, w)
  const [result] = resultsOf(w)
  const answer = JSON.parse(result?.text ?? 'null')
  assert.equal(answer.kind, 'RUNS')
  assert.deepEqual(answer.copy, {
    name: 'sankhya_vendas',
    connections: ['Matriz'],
    schedule: answer.copy.schedule,
    interval: '30m',
  })
  const [refused, complete] = answer.runs
  const { startedAt, endedAt, ...rest } = refused
  assert.ok(Date.parse(startedAt) > 0 && Date.parse(endedAt) > 0)
  assert.deepEqual(rest, {
    outcome: 'ERROR',
    failure: {
      code: 'COPY_SOURCE_REFUSED',
      phrase: 'O sistema recusou a leitura.',
      action: 'Confira a conexão.',
    },
    whole: false,
    system: SANKHYA_REFUSED,
  })
  assert.deepEqual([complete.outcome, complete.failure, complete.system], ['COMPLETE', null, null])
  assert.ok(!result?.text.includes(w.on.matriz), 'nenhum id de conexão')
})

test('cinco rodadas no máximo', async (t) => {
  const w = await copyWorld(t, ask('sankhya_clientes'))
  w.fake.switches.refuse.add('consultar')
  for (let each = 0; each < 6; each += 1) await refusedRun(w, 'clientes')
  await turn(t, w)
  const { runs } = JSON.parse(resultsOf(w)[0]?.text ?? 'null')
  assert.equal(runs.length, 5)
  const starts = runs.map((run: { startedAt: string }) => Date.parse(run.startedAt))
  assert.deepEqual(
    starts,
    [...starts].sort((a, b) => b - a),
  )
})

test('o membro também recebe copy_runs', async (t) => {
  const w = await copyWorld(t, ask('sankhya_vendas'))
  const bruno = await readerOfVendas(w)
  await turn(t, w, bruno)
  assert.ok(w.on.calls.at(0)?.tools.includes(ASSISTANT_TOOL.copyRuns))
})

test('quem lê a tabela pelo papel lê as rodadas', async (t) => {
  const w = await copyWorld(t, ask('sankhya_vendas'))
  const bruno = await readerOfVendas(w)
  await turn(t, w, bruno)
  assert.equal(JSON.parse(resultsOf(w)[0]?.text ?? 'null').kind, 'RUNS')
})

test('a tabela que o papel não lê responde como a que não existe', async (t) => {
  const steps = [...ask('sankhya_clientes').slice(0, 1), ...ask('nao_existe')]
  const w = await copyWorld(t, steps)
  const bruno = await readerOfVendas(w)
  const asking = await conversation(t, w, bruno)
  await asking()
  await asking()
  const [hidden, missing] = resultsOf(w)
  assert.ok(hidden?.error && missing?.error)
  assert.equal(hidden.text, missing.text)
  assert.ok(!hidden.text.includes('sankhya_clientes'))
  assert.deepEqual(JSON.parse(hidden.text.slice(hidden.text.indexOf('{'))), {
    kind: 'NOT_FOUND',
    status: null,
    code: null,
    message: null,
    body: null,
    reason: 'No copy has this table name. Call data_describe to list the tables.',
  })
})

test('a tabela que não existe', async (t) => {
  const w = await copyWorld(t, ask(`nao_existe_${randomUUID().slice(0, 4)}`))
  await turn(t, w)
  const [missing] = resultsOf(w)
  assert.ok(missing?.error)
  assert.equal(JSON.parse(missing.text.slice(missing.text.indexOf('{'))).kind, 'NOT_FOUND')
})

test('o desenvolvedor recebe a tabela de fora do papel como a que não existe', async (t) => {
  const steps = [...ask('sankhya_clientes').slice(0, 1), ...ask('nao_existe')]
  const w = await copyWorld(t, steps)
  const davi = await memberOn(
    w.on.hub,
    w.on.companyId,
    { name: 'Davi Costa', email: 'davi@example.test' },
    'developer',
  )
  const asking = await conversation(t, w, davi)
  await asking()
  await asking()
  const [hidden, missing] = resultsOf(w)
  assert.ok(hidden?.error && missing?.error)
  assert.equal(hidden.text, missing.text)
  assert.equal(JSON.parse(hidden.text.slice(hidden.text.indexOf('{'))).kind, 'NOT_FOUND')
})

test('a cópia que some entre a lista e as rodadas responde como a que não existe', async (t) => {
  const w = await copyWorld(t, ask('sankhya_vendas'))
  const { companyId, personId } = w
  const { copies } = await w.on.hub.copies.list({ companyId, personId, named: [] })
  const thrown = await copyGoneBetween({ companyId, personId, copies }, 'sankhya_vendas')
  assert.equal(JSON.parse(thrown.message).kind, 'NOT_FOUND')
})
