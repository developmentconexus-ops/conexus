import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { Balloon } from '@conexus/hub-api'
import { AgentId, BalloonId, OperationId } from '@conexus/hub-api'
import { call, codeOf, post } from '../../hub/identity/test-hub.ts'
import { madeAgent } from '../agents/test-agents.ts'
import { draftOf, madeWorkflow, saved, viewOf, workflowsOn } from './test-workflow-hub.ts'
import { foreach, ifBalloon, loop, notify, parallel, read, use } from './test-workflows.ts'

const INPUT = { codigoEmpresa: '1', page: '1' }

type On = Awaited<ReturnType<typeof workflowsOn>>

/** The problems the Hub lists for a draft it just saved, each as `CODIGO@balão`. */
async function problemsFor(on: On, balloons: Balloon[], place: object = { kind: 'COMPANY' }) {
  const made = await madeWorkflow(on.hub, on.ana, on.base, draftOf(balloons), place)
  return made.problems.map((each) => `${each.code}@${each.balloonId}`)
}

function reading(on: On, n: number, input: Record<string, string> = INPUT) {
  return { ...read(n, input), connectionId: on.matrizId }
}

function agentBalloon(n: number, agentId: string): Balloon {
  const parsed = { kind: 'PUBLISHED', agentId: AgentId.parse(agentId) } as const
  return {
    kind: 'AGENT',
    id: BalloonId.parse(`b${n}`),
    title: `Agente ${n}`,
    agent: parsed,
    prompt: 'oi',
    approver: { kind: 'ACTIVATED_BY' },
  }
}

test('o rascunho: cria, repete a tentativa e responde o mesmo workflow; outro corpo é conflito', async (t) => {
  const on = await workflowsOn(t)
  const { hub, ana, base } = on
  const key = randomUUID()
  const body = { place: { kind: 'COMPANY' }, draft: draftOf([reading(on, 1), notify(2, 'oi')]) }
  const first = await post(hub, ana, base, body, key)
  assert.equal(first.statusCode, 201, first.body)
  assert.deepEqual(viewOf(first).problems, [])
  const again = await post(hub, ana, base, body, key)
  assert.equal(again.statusCode, 201)
  assert.equal(viewOf(again).id, viewOf(first).id)
  const other = await post(hub, ana, base, { ...body, draft: draftOf([notify(1, 'outro')]) }, key)
  assert.equal(other.statusCode, 409)
  assert.equal(codeOf(other), 'IDEMPOTENCY_CONFLICT')
})

test('o rascunho: grava, sobe a revision e devolve os problemas; recusa o que o esquema não aceita e a revision velha', async (t) => {
  const on = await workflowsOn(t)
  const { hub, ana, base } = on
  const view = await madeWorkflow(hub, ana, base, draftOf([notify(1, 'oi')]))
  assert.equal(view.revision, 0)
  const next = await saved(hub, ana, base, view, draftOf([notify(1, 'um'), notify(2, 'dois')]))
  assert.equal(next.statusCode, 200, next.body)
  assert.equal(viewOf(next).revision, 1)
  const stale = await saved(hub, ana, base, view, draftOf([notify(1, 'velho')]))
  assert.equal(stale.statusCode, 409)
  assert.equal(codeOf(stale), 'WORKFLOW_DRAFT_STALE')
  const malformed = await call(hub, ana, 'PUT', `${base}/${view.id}/draft`, {
    revision: 1,
    draft: { name: 'x', trigger: { kind: 'MANUAL' }, balloons: [{ kind: 'NADA' }] },
  })
  assert.equal(malformed.statusCode, 400)
  assert.equal(codeOf(malformed), 'REQUEST_MALFORMED')
  const reread = await call(hub, ana, 'GET', `${base}/${view.id}`)
  assert.equal(viewOf(reread).revision, 1)
  const missing = await call(hub, ana, 'GET', `${base}/${randomUUID()}`)
  assert.equal(missing.statusCode, 404)
  assert.equal(codeOf(missing), 'WORKFLOW_NOT_FOUND')
})

test('o rascunho: cada problema de sentido vem com o código e o balão', async (t) => {
  const on = await workflowsOn(t)
  const write = { ...reading(on, 1), operation: OperationId.parse('lancarPedido') }
  assert.deepEqual(await problemsFor(on, [write]), ['OPERATION_WRONG_CLASS@b1'])
  assert.deepEqual(await problemsFor(on, [notify(1, '{{b9.texto}}'), notify(9, 'x')]), [
    'REF_NOT_BEFORE@b1',
  ])
  assert.deepEqual(await problemsFor(on, [ifBalloon(1, 'total', [notify(2, 'x')], [])]), [
    'IF_FIELD_NOT_NUMBER@b1',
  ])
  assert.deepEqual(await problemsFor(on, [ifBalloon(1, 'total', [], [])]), [
    'IF_EMPTY@b1',
    'IF_FIELD_NOT_NUMBER@b1',
  ])
  assert.deepEqual(
    await problemsFor(on, [
      ifBalloon(1, 'total', [notify(2, 'x')], []),
      notify(3, '{{b2.avisados}}'),
    ]),
    ['IF_FIELD_NOT_NUMBER@b1', 'REF_INSIDE_BRANCH@b3'],
  )
  const empty = { ...reading(on, 1), connectionId: null, operation: null }
  assert.deepEqual(await problemsFor(on, [empty]), ['BALLOON_INCOMPLETE@b1'])
  const kinds = await problemsFor(on, [
    parallel(1, [[notify(2, 'a')], [notify(3, 'b')]]),
    loop(4, 3, 'x', [notify(5, 'c')]),
  ])
  assert.ok(kinds.includes('BALLOON_KIND_LATER@b1'))
  assert.ok(kinds.includes('BALLOON_KIND_LATER@b4'))
  const lists = await problemsFor(on, [notify(1, 'antes'), foreach(2, [notify(3, 'x')])])
  assert.ok(lists.includes('FOREACH_NOT_A_LIST@b2'))
  const many = Array.from({ length: 51 }, (_, i) => notify(i + 1, 'x'))
  assert.deepEqual(await problemsFor(on, many), ['WORKFLOW_TOO_MANY_BALLOONS@null'])
})

test('o rascunho: o agente de outro Projeto e o agente num workflow da empresa', async (t) => {
  const on = await workflowsOn(t)
  const { hub, ana, company } = on
  const made = await post(hub, ana, `${company}/projects`, { name: 'Outro' })
  const other = String(Object(made.json()).project.id)
  const outside = await madeAgent(hub, ana, `${company}/projects/${other}/agents`, 'De fora')
  const inside = await madeAgent(hub, ana, on.agents, 'De dentro')
  const place = { kind: 'PROJECT', projectId: on.projectId }
  assert.deepEqual(await problemsFor(on, [agentBalloon(1, outside.id)], place), [
    'AGENT_OTHER_PROJECT@b1',
  ])
  assert.deepEqual(await problemsFor(on, [agentBalloon(1, inside.id)], place), [
    'AGENT_NOT_PUBLISHED@b1',
  ])
  assert.deepEqual(await problemsFor(on, [agentBalloon(1, inside.id)]), ['AGENT_IN_COMPANY@b1'])
  assert.deepEqual(await problemsFor(on, [agentBalloon(1, randomUUID())], place), [
    'AGENT_NOT_FOUND@b1',
  ])
})

test('o rascunho: o USE de um workflow sem versão, dele mesmo e de outro lugar', async (t) => {
  const on = await workflowsOn(t)
  const { hub, ana, base } = on
  const unpublished = await madeWorkflow(hub, ana, base, draftOf([notify(1, 'x')]))
  assert.deepEqual(await problemsFor(on, [use(1, unpublished.id)]), ['USE_NOT_PUBLISHED@b1'])
  const itself = await madeWorkflow(hub, ana, base, draftOf([notify(1, 'x')]))
  const using = await saved(hub, ana, base, itself, draftOf([use(1, itself.id)]))
  assert.deepEqual(
    viewOf(using).problems.map((each) => each.code),
    ['USE_ITSELF'],
  )
  const company = await madeWorkflow(hub, ana, base, draftOf([notify(1, 'x')]))
  const published = await post(hub, ana, `${base}/${company.id}/publish`, { revision: 0 })
  assert.equal(published.statusCode, 200, published.body)
  const place = { kind: 'PROJECT', projectId: on.projectId }
  assert.deepEqual(await problemsFor(on, [use(1, company.id)], place), ['USE_OTHER_PLACE@b1'])
})
