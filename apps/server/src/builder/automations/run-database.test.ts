import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { AutomationId, AutomationRunId, CompanyId, PersonId, RunOutcome } from '@conexus/hub-api'
import type { Session } from '@mastra/core/agent-controller'
import { Mastra } from '@mastra/core/mastra'
import { InMemoryStore } from '@mastra/core/storage'
import pg from 'pg'
import type { Notify } from '../../hub/notifications/public.ts'
import { silent } from '../../platform/test-database.ts'
import { AUTOMATION_WORKFLOW, automationRun } from './public.ts'
import type { AutomationInput } from './run.ts'

/** The Hub's database going away under the owner's check, as Postgres says it (SQLSTATE 57P01). */
function shutdown() {
  return Object.assign(new pg.DatabaseError('terminating connection', 0, 'error'), {
    code: '57P01',
  })
}

function anInput(): AutomationInput {
  return {
    ...{ version: 1, name: 'Resumo de vendas', prompt: 'O resumo de ontem.' },
    ...{ automationId: AutomationId.parse(`schedule_conexus-automation-${randomUUID()}`) },
    ...{ companyId: CompanyId.parse('a'.repeat(32)), personId: PersonId.parse('person-ana') },
    ...{ place: { kind: 'COMPANY' }, connections: [] },
  }
}

async function ran(
  assistant: Parameters<typeof automationRun>[0]['assistant'],
  input: AutomationInput,
) {
  const told: Parameters<Notify['automationRan']>[0][] = []
  const workflow = automationRun({
    assistant,
    notify: {
      automationRan: async (each) => {
        told.push(each)
      },
    },
    updating: () => false,
    turnMs: 1_000,
    log: silent,
  })
  const mastra = new Mastra({
    storage: new InMemoryStore(),
    workflows: { [AUTOMATION_WORKFLOW]: workflow },
  })
  const runId = AutomationRunId.parse(`sched_${input.automationId}_${Date.now()}`)
  const run = await mastra.getWorkflow(AUTOMATION_WORKFLOW).createRun({ runId })
  const result = await run.start({ inputData: input })
  assert.equal(result.status, 'success')
  return { told, outcome: RunOutcome.parse(result.status === 'success' ? result.result : null) }
}

test('o banco do Hub fora no primeiro passo: a execução termina FAILED com DATABASE_UNAVAILABLE, sem conversa, e o dono é avisado', async () => {
  const { told, outcome } = await ran(
    {
      admit: () => Promise.reject(shutdown()),
      open: () => Promise.reject(new Error('no conversation before the check')),
      turnEnd: () => {
        throw new Error('no turn before the check')
      },
      asked: () => Promise.resolve(false),
    },
    anInput(),
  )
  assert.deepEqual(outcome, { kind: 'FAILED', code: 'DATABASE_UNAVAILABLE', conversationId: null })
  assert.deepEqual(
    told.map((each) => each.outcome),
    [outcome],
  )
})

test('a pergunta que não sai: o envio que falha solta os ouvintes do fim do turno e a execução termina FAILED', async () => {
  let letGo = 0
  const session: Session = Object.assign(Object.create(null), {
    sendMessage: () => Promise.reject(shutdown()),
    abort: () => undefined,
  })
  const { outcome } = await ran(
    {
      admit: () => Promise.resolve(),
      open: () => Promise.resolve(Object.assign(Object.create(null), { session })),
      turnEnd: () => ({
        ended: new Promise<never>(() => undefined),
        stop: () => {
          letGo += 1
        },
      }),
      asked: () => Promise.resolve(false),
    },
    anInput(),
  )
  assert.equal(letGo, 1)
  assert.equal(outcome.kind, 'FAILED')
})
