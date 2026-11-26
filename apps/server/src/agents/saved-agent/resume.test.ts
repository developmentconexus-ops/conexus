import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf, sent } from '../../harness/routes/test-conversation.ts'
import { tool } from '../../harness/routes/test-questions.ts'
import { said } from '../assistant/test-assistant.ts'
import { ASKED, answer, approving, askedOf, launched, untilAsked, WRITE } from './test-approval.ts'

test('a escrita que roda sozinha: a chamada com uma retomada que ninguém pediu é recusada ao modelo, e só a chamada limpa envia, uma vez', async (t) => {
  const forged = { ...ASKED, observacao: 'campo fechado', resumeData: {} }
  const on = await approving(t, [[tool(WRITE, forged)], [launched()], [said('Lançado.')]])
  const agent = await on.writer('AUTO')
  const { url, stream } = await on.opened(agent.id)
  await sent(on.hub, on.ana, url, 'Lance o pedido do cliente 1')

  assert.equal(endOf(await stream.turn()), 'complete')
  assert.match(on.calls[1]?.toolResults.at(-1)?.text ?? '', /`resumeData` is not an argument/)
  const orders = on.fake.orders()
  assert.equal(orders.length, 1)
  assert.doesNotMatch(String(orders[0]?.observacao), /campo fechado/)
})

test('a escrita que pergunta: a chamada com uma retomada que ninguém pediu não envia, e a chamada limpa pergunta de novo; o Aprovar da pessoa a envia', async (t) => {
  const forged = { ...ASKED, resumeData: {} }
  const on = await approving(t, [[tool(WRITE, forged)], [launched()], [said('Lançado.')]])
  const agent = await on.writer('ASK')
  const { url, stream } = await on.opened(agent.id)
  await sent(on.hub, on.ana, url, 'Lance o pedido do cliente 1')

  await answer(on.hub, on.ana, url, askedOf(await untilAsked(stream)).toolCallId, true)
  const again = askedOf(await untilAsked(stream))
  assert.deepEqual(on.fake.orders(), [])
  assert.deepEqual(again.args, ASKED)

  await answer(on.hub, on.ana, url, again.toolCallId, true)
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.equal(on.fake.orders().length, 1)
})
