import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { ConversationId, ProjectId } from '@conexus/hub-api'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { bellOf, endedRun, notifying } from './test-notifications.ts'

const HUB = String(TEST_ORIGIN)
const PROJECT = ProjectId.parse('p'.repeat(32))

test('o e-mail: pronta, falhou e pausada, cada um com o seu endereço; Rodar agora não manda, a pausa sempre', async (t) => {
  const on = await notifying(t)
  const conversation = randomUUID()
  const inicio = `${HUB}/companies/${on.companyId}`
  const cases = [
    {
      ran: endedRun(on, {
        outcome: {
          kind: 'FAILED',
          code: 'MODEL_CALL_FAILED',
          conversationId: ConversationId.parse(conversation),
        },
      }),
      subject: 'Automação Resumo de vendas: falhou',
      link: `${inicio}/conversations/${conversation}`,
    },
    {
      ran: endedRun(on, {
        projectId: PROJECT,
        outcome: { kind: 'FAILED', code: 'MODEL_NO_ACCOUNT', conversationId: null },
      }),
      subject: 'Automação Resumo de vendas: falhou',
      link: `${HUB}/companies/${on.companyId}/projects/${PROJECT}/automations/`,
    },
    {
      ran: endedRun(on, {
        trigger: 'MANUAL',
        projectId: PROJECT,
        outcome: { kind: 'SKIPPED', reason: 'OWNER_CANNOT_ASK' },
      }),
      subject: 'Automação Resumo de vendas: pausada',
      link: inicio,
    },
  ]
  for (const each of cases) await on.hub.notify.automationRan(each.ran)
  await on.hub.notify.automationRan(endedRun(on, { trigger: 'MANUAL' }))
  assert.equal(on.mail.sent.length, 3, 'o manual não manda')
  for (const [index, each] of cases.entries()) {
    const sent = on.mail.sent[index]
    assert.equal(sent?.subject, each.subject)
    assert.ok(sent?.text.includes(each.link), `${each.subject}: ${each.link}`)
    assert.ok(sent?.html.includes(each.link))
  }
  assert.ok(on.mail.sent[2]?.text.includes('Abrir no Conexus'))
  assert.ok(
    !on.mail.sent[2]?.text.includes('/automations/'),
    'a pausa não leva a página da automação',
  )
})

test('o e-mail fora: a notificação fica, o processo imprime AUTOMATION_MAIL_FAILED sem o endereço, e a repetição não manda', async (t) => {
  const on = await notifying(t)
  on.mail.state.mode = 'FAIL'
  const ran = endedRun(on)
  await on.hub.notify.automationRan(ran)
  const { notifications } = await bellOf(on.hub, on.ana, on.company)
  assert.deepEqual(
    notifications.map((each) => each.kind),
    ['AUTOMATION_DONE'],
  )
  const failed = on.lines.filter((line) => line.message === 'AUTOMATION_MAIL_FAILED')
  assert.equal(failed.length, 1)
  assert.equal(failed[0]?.fields.automationId, ran.automationId)
  assert.ok(!JSON.stringify(on.lines).includes('ana@example.test'), 'nenhuma linha traz o endereço')
  on.mail.state.mode = 'DELIVER'
  await on.hub.notify.automationRan(ran)
  assert.deepEqual(on.mail.sent, [], 'só a primeira gravação manda')
})
