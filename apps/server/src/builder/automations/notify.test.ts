import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bellOf } from '../../hub/notifications/test-notifications.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { title } from '../conversation/test-conversation.ts'
import {
  aMinuteAhead,
  answering,
  automating,
  created,
  ended,
  ranNow,
  salesSummary,
} from './test-automations.ts'

test('o aviso: cada execução, ao fim, avisa o dono: pronta com a conversa, falhou com o código e a conversa', async (t) => {
  const done = await automating(t)
  const automation = await created(done.hub, done.ana, done.automations, salesSummary([]))
  const url = `${done.automations}/${automation.id}`
  const run = await ended(done.hub, done.ana, url, await ranNow(done.hub, done.ana, url))
  const { notifications, unread } = await bellOf(done.hub, done.ana, done.company)
  assert.equal(unread, 1)
  assert.deepEqual(
    notifications.map((each) => [each.kind, each.read, each.conversationId]),
    [['AUTOMATION_DONE', false, run.state.conversationId]],
  )
  assert.deepEqual(notifications[0]?.automation, { id: automation.id, name: 'Resumo de vendas' })

  const failing = await automating(t, (asked) => title(asked) ?? { kind: 'refuse', status: 529 })
  const failed = await created(failing.hub, failing.ana, failing.automations, salesSummary([]))
  const failedUrl = `${failing.automations}/${failed.id}`
  const ran = await ranNow(failing.hub, failing.ana, failedUrl)
  const bad = await ended(failing.hub, failing.ana, failedUrl, ran)
  const [row] = (await bellOf(failing.hub, failing.ana, failing.company)).notifications
  assert.deepEqual(
    [row?.kind, row?.code, row?.conversationId],
    ['AUTOMATION_FAILED', 'MODEL_CALL_FAILED', bad.state.conversationId],
  )
})

test('o e-mail do horário: o disparo manda ao dono o assunto, o nome e o botão com o endereço da conversa pelo lugar, e nenhum número da empresa', {
  timeout: 150_000,
}, async (t) => {
  const answer = { kind: 'text' as const, text: 'Vendas de ontem: 98765 reais.' }
  const on = await automating(t, answering([answer]))
  const cadence = await aMinuteAhead()
  const body = salesSummary([on.matriz], { cadence, projectId: on.projectId })
  const automation = await created(on.hub, on.ana, on.automations, body)
  const run = await ended(on.hub, on.ana, `${on.automations}/${automation.id}`)
  assert.equal(run.trigger, 'SCHEDULED')
  assert.equal(run.state.kind, 'DONE')
  const conversation = String(run.state.conversationId)
  const link = `${TEST_ORIGIN}/companies/${on.companyId}/projects/${on.projectId}/assistant/${conversation}`
  const [sent, ...more] = on.mail.sent
  assert.deepEqual(more, [], 'um e-mail por execução')
  assert.equal(sent?.to, 'ana@example.test')
  assert.equal(sent?.subject, 'Automação Resumo de vendas: pronta')
  for (const part of [sent?.html, sent?.text]) {
    assert.ok(part?.includes('Resumo de vendas'))
    assert.ok(part?.includes('Abrir no Conexus'))
    assert.ok(part?.includes(link), 'o botão leva à conversa pelo Projeto')
    assert.ok(!part?.includes('98765'), 'nenhum número da empresa')
  }
})
