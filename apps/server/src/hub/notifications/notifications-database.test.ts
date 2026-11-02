import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { AutomationId, AutomationRunId, CompanyId, PersonId } from '@conexus/hub-api'
import { TEST_ORIGIN, unreachableDatabase } from '../../platform/test-database.ts'
import { notificationsOf } from './public.ts'

test('o banco do Hub fora: o aviso não sai, o processo imprime a causa e o passo não falha', async (t) => {
  const lines: { fields: Record<string, unknown>; message: string }[] = []
  const log = {
    info: (fields: Record<string, unknown>, message: string) => lines.push({ fields, message }),
    error: (fields: Record<string, unknown>, message: string) => lines.push({ fields, message }),
  }
  const { notify } = notificationsOf({
    database: await unreachableDatabase(t),
    identity: {
      admitMember: () => Promise.reject(new Error('unused')),
      peopleNamed: () => Promise.reject(new Error('unused')),
    },
    sendMail: () => Promise.reject(new Error('no mail without a notification')),
    publicOrigin: TEST_ORIGIN,
    log,
  })
  const automationId = AutomationId.parse(`schedule_conexus-automation-${randomUUID()}`)
  await notify.automationRan({
    ...{ companyId: CompanyId.parse('a'.repeat(32)), personId: PersonId.parse('person-ana') },
    ...{ automationId, name: 'Resumo de vendas', projectId: null },
    runId: AutomationRunId.parse(`sched_${automationId}_1`),
    trigger: 'SCHEDULED',
    outcome: { kind: 'FAILED', code: 'DATABASE_UNAVAILABLE', conversationId: null },
  })
  assert.deepEqual(
    lines.map((each) => each.message),
    ['DATABASE_UNAVAILABLE'],
  )
  assert.equal(lines[0]?.fields.automationId, automationId)
  assert.match(String(lines[0]?.fields.causes), /Error/)
})
