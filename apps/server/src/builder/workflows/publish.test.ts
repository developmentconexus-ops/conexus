import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { Balloon } from '@conexus/hub-api'
import { AgentId, BalloonId, OperationId, PersonId, WorkflowId } from '@conexus/hub-api'
import { call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import { drafted, madeAgent, publishedNow } from '../agents/test-agents.ts'
import { hubBeside } from '../conversation/test-conversation.ts'
import { compiled } from './public.ts'
import { draftOf, madeWorkflow, saved, viewOf, workflowsOn } from './test-workflow-hub.ts'
import { frozenOf, notify, read, use } from './test-workflows.ts'

const INPUT = { codigoEmpresa: '1', page: '1' }
const READS = ['clientes', 'empresas', 'pedidos', 'consultar', 'carregar']

type On = Awaited<ReturnType<typeof workflowsOn>>

function reading(on: On, n: number, operation = 'pedidos'): ReturnType<typeof read> {
  return { ...read(n, INPUT), connectionId: on.matrizId, operation: OperationId.parse(operation) }
}

function setRole(on: On, connectors: string[], unattended = false) {
  return call(on.hub, on.ana, 'PUT', `${on.company}/roles/developer`, {
    connectors: { sankhya: connectors },
    unattended,
  })
}

function dora(on: On) {
  return memberOn(
    on.hub,
    on.companyId,
    { name: 'Dora Reis', email: 'dora@example.test' },
    'developer',
  )
}

async function definitions(on: Pick<On, 'hub'>) {
  const { rows } = await on.hub.test.mastraPool.query(
    'select id, status from mastra.mastra_workflow_definitions order by id',
  )
  return rows.map((row) => `${String(row.id)}:${String(row.status)}`)
}

async function publishedBy(on: On, who: Parameters<typeof post>[1], id: string, revision = 0) {
  return post(on.hub, who, `${on.base}/${id}/publish`, { revision })
}

test('a publicação recusada: enquanto houver problema ERROR, inclusive os de papel de quem publica, e nada vai ao Mastra', async (t) => {
  const on = await workflowsOn(t)
  const { hub, ana, base } = on
  assert.equal((await setRole(on, READS)).statusCode, 200)
  const doraOf = await dora(on)
  const owned = await madeWorkflow(hub, ana, base, draftOf([reading(on, 1)]))
  assert.equal((await publishedBy(on, ana, owned.id)).statusCode, 200)
  assert.equal((await setRole(on, ['empresas'])).statusCode, 200)
  const own = await madeWorkflow(hub, doraOf, base, draftOf([reading(on, 1)]))
  assert.deepEqual(
    own.problems.map((each) => each.code),
    ['OPERATION_NOT_IN_ROLE'],
  )
  const refused = await publishedBy(on, doraOf, own.id)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'WORKFLOW_HAS_PROBLEMS'])
  const used = await madeWorkflow(hub, doraOf, base, draftOf([use(1, owned.id)]))
  assert.deepEqual(
    used.problems.map((each) => `${each.code}@${each.balloonId}`),
    ['OPERATION_NOT_IN_ROLE@b1'],
  )
  const write: Balloon = {
    kind: 'WRITE',
    id: BalloonId.parse('b1'),
    title: 'Lançar',
    connectionId: on.matrizId,
    operation: OperationId.parse('lancarPedido'),
    input: {},
    approval: 'AUTO',
    approver: { kind: 'ACTIVATED_BY' },
  }
  assert.equal((await setRole(on, ['empresas', 'lancarPedido'])).statusCode, 200)
  const alone = await madeWorkflow(hub, doraOf, base, draftOf([write]))
  assert.ok(
    alone.problems.some((each) => each.code === 'WRITE_AUTO_NOT_ALLOWED'),
    JSON.stringify(alone.problems),
  )
  const ghost = PersonId.parse(randomUUID())
  const gone = await madeWorkflow(hub, ana, base, draftOf([{ ...notify(1, 'x'), people: [ghost] }]))
  assert.deepEqual(
    gone.problems.map((each) => each.code),
    ['PERSON_NOT_FOUND'],
  )
  const elsewhere = await madeWorkflow(
    hub,
    ana,
    base,
    draftOf([{ ...reading(on, 1), connectionId: on.filialId }]),
    {
      kind: 'PROJECT',
      projectId: on.projectId,
    },
  )
  assert.deepEqual(
    elsewhere.problems.map((each) => each.code),
    ['CONNECTION_NOT_OFFERED'],
  )
  const unpublished = await call(hub, ana, 'GET', `${base}/${own.id}`)
  assert.equal(viewOf(unpublished).published, null)
  assert.deepEqual(await definitions(on), [`wf-${owned.id}-v1:active`])
})

test('a publicação recusada: sem manageAutomations a admissão responde NOT_FOUND (S10), como a das automações, e nada se grava', async (t) => {
  const on = await workflowsOn(t)
  const mia = await memberOn(
    on.hub,
    on.companyId,
    { name: 'Mia Lima', email: 'mia@example.test' },
    'member',
  )
  const made = await post(on.hub, mia, on.base, {
    place: { kind: 'COMPANY' },
    draft: draftOf([notify(1, 'x')]),
  })
  assert.deepEqual([made.statusCode, codeOf(made)], [404, 'NOT_FOUND'])
  const own = await madeWorkflow(on.hub, on.ana, on.base, draftOf([notify(1, 'x')]))
  const refused = await publishedBy(on, mia, own.id)
  assert.equal(codeOf(refused), 'NOT_FOUND')
  assert.deepEqual(await definitions(on), [])
})

/** A workflow of the Projeto that reads, uses another and asks a published agent, published as version 1. */
async function published(on: On) {
  const { hub, ana, base } = on
  const place = { kind: 'PROJECT', projectId: on.projectId }
  const used = await madeWorkflow(hub, ana, base, draftOf([notify(1, 'usado')]), place)
  assert.equal((await publishedBy(on, ana, used.id)).statusCode, 200)
  const agent = await madeAgent(hub, ana, on.agents)
  const live = await publishedNow(
    hub,
    ana,
    on.agents,
    await drafted(hub, ana, on.agents, agent, { instructions: 'Ajude.' }),
  )
  const agentBalloon: Balloon = {
    kind: 'AGENT',
    id: BalloonId.parse('b3'),
    title: 'Agente',
    agent: { kind: 'PUBLISHED', agentId: AgentId.parse(live.id) },
    prompt: 'oi',
    approver: { kind: 'ACTIVATED_BY' },
  }
  const made = await madeWorkflow(
    hub,
    ana,
    base,
    draftOf([reading(on, 1), use(2, used.id), agentBalloon, notify(4, 'oi {{b1.resultado}}')]),
    place,
  )
  assert.deepEqual(made.problems, [])
  const first = await publishedBy(on, ana, made.id)
  assert.equal(first.statusCode, 200, first.body)
  const view = viewOf(first)
  assert.equal(view.published?.number, 1)
  assert.equal(view.activeBy, view.published?.publishedBy)
  assert.deepEqual(
    view.published?.uses.map((each) => each.versionNumber),
    [1],
  )
  assert.deepEqual(
    view.published?.agents.map((each) => each.versionNumber),
    [1],
  )
  return { made, used, view }
}

test('publicar: grava a versão com o frozen, ativa no mesmo UPDATE e registra um caminho por USE', async (t) => {
  const on = await workflowsOn(t)
  const { hub } = on
  const { made } = await published(on)
  const [row] = await hub.test.asOwner(
    'select active_version, active_by from builder.workflow where id = $1',
    [made.id],
  )
  assert.equal(row?.active_version, 1)
  const [version] = await hub.test.asOwner(
    'select frozen from builder.workflow_version where workflow_id = $1',
    [made.id],
  )
  const frozen = Object(version?.frozen)
  assert.deepEqual(frozen.declared, [{ connectionId: on.matrizId, operation: 'pedidos' }])
  assert.deepEqual(frozen.reads, [{ balloonId: 'b1', many: true }])
  assert.deepEqual(
    (await definitions(on)).filter((each) => each.includes(made.id)),
    [`wf-${made.id}-v1:active`, `wf-${made.id}-v1-b2_0:active`],
  )
  assert.ok(hub.mastra.listWorkflows()[`wf-${made.id}-v1`] !== undefined)
})

test('publicar: a mesma revisão responde a mesma versão, e publicar de novo o usado não muda o frozen', async (t) => {
  const on = await workflowsOn(t)
  const { hub, ana, base } = on
  const { made, used, view } = await published(on)
  const [before] = await hub.test.asOwner(
    'select frozen from builder.workflow_version where workflow_id = $1',
    [made.id],
  )
  const same = await publishedBy(on, ana, made.id)
  assert.equal(viewOf(same).published?.number, 1)
  const [count] = await hub.test.asOwner(
    'select count(*)::int as n from builder.workflow_version where workflow_id = $1',
    [made.id],
  )
  assert.equal(count?.n, 1)
  const usedNext = await saved(
    hub,
    ana,
    base,
    viewOf(await call(hub, ana, 'GET', `${base}/${used.id}`)),
    draftOf([notify(1, 'novo')]),
  )
  assert.equal((await publishedBy(on, ana, used.id, viewOf(usedNext).revision)).statusCode, 200)
  const [after] = await hub.test.asOwner(
    'select frozen from builder.workflow_version where workflow_id = $1 and number = 1',
    [made.id],
  )
  assert.deepEqual(after?.frozen, before?.frozen)
  const second = await saved(hub, ana, base, view, view.draft ?? draftOf([]))
  const next = await publishedBy(on, ana, made.id, viewOf(second).revision)
  assert.equal(viewOf(next).published?.number, 2)
  assert.deepEqual(
    (await definitions(on)).filter(
      (each) => each.startsWith(`wf-${made.id}-v`) && /-v\d+:/.test(each),
    ),
    [`wf-${made.id}-v1:active`, `wf-${made.id}-v2:active`],
  )
})

test('depois do reinício: a versão está no Mastra; a definição sem versão no Hub é apagada pela passagem do início', async (t) => {
  const on = await workflowsOn(t)
  const { hub, ana, base } = on
  const made = await madeWorkflow(hub, ana, base, draftOf([reading(on, 1), notify(2, 'x')]))
  assert.equal((await publishedBy(on, ana, made.id)).statusCode, 200)
  const stray = WorkflowId.parse(randomUUID())
  await hub.mastra.addDynamicWorkflows(
    compiled(
      { kind: 'VERSION', workflowId: stray, version: 1, path: [] },
      frozenOf([notify(1, 'x')]),
      { fields: {} },
    ),
  )
  assert.ok((await definitions(on)).includes(`wf-${stray}-v1:active`))
  const beside = await hubBeside(t, hub)
  assert.ok(beside.mastra.listWorkflows()[`wf-${made.id}-v1`] !== undefined)
  await beside.workflows.boot()
  assert.deepEqual(await definitions(on), [`wf-${made.id}-v1:active`])
})

test('apagar: apaga as definições, depois responde WORKFLOW_NOT_FOUND, sem nome do Mastra no corpo nem no log', async (t) => {
  const on = await workflowsOn(t)
  const { hub, ana, base } = on
  const made = await madeWorkflow(hub, ana, base, draftOf([notify(1, 'x')]))
  assert.equal((await publishedBy(on, ana, made.id)).statusCode, 200)
  assert.equal((await call(hub, ana, 'DELETE', `${base}/${made.id}`)).statusCode, 204)
  assert.deepEqual(await definitions(on), [])
  const gone = await call(hub, ana, 'GET', `${base}/${made.id}`)
  assert.deepEqual([gone.statusCode, codeOf(gone)], [404, 'WORKFLOW_NOT_FOUND'])
  assert.doesNotMatch(gone.body, /wf-/)
  const unknown = await call(hub, ana, 'DELETE', `${base}/${randomUUID()}`)
  assert.equal(codeOf(unknown), 'WORKFLOW_NOT_FOUND')
  assert.doesNotMatch(JSON.stringify(hub.lines), /wf-/)
})
