import assert from 'node:assert/strict'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ProposedAutomation } from '@conexus/hub-api'
import { post } from '../../../hub/identity/test-hub.ts'
import { testCliProxy } from '../../../platform/test-cliproxy-binary.ts'
import { assisting, created, said, talking } from '../../assistant/test-assistant.ts'
import { endOf, messagesOf, title } from '../../conversation/test-conversation.ts'
import { tool } from '../../conversation/test-questions.ts'

const PROPOSE = 'propose_automation'

/** A company whose Assistant answers through Google's sign-in, the CLIProxy double; the Claude account answers only the titles. */
async function onGoogle(t: TestContext, ...recordings: string[]) {
  const on = await assisting(t, (call) => title(call) ?? { kind: 'refuse', status: 500 })
  await on.hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'google_cliproxy')`,
    [on.companyId],
  )
  const double = testCliProxy()
  for (const file of ['mode', 'runs', 'asked']) rmSync(join(double.control, file), { force: true })
  writeFileSync(join(double.control, 'recording'), recordings.join('\n'))
  t.after(() => rmSync(join(double.control, 'recording'), { force: true }))
  const signIns = `/api/companies/${on.companyId}/model-account-sign-ins`
  const opened = await post(on.hub, on.ana, signIns, {
    owner: 'company',
    kind: 'google_cliproxy',
    label: 'Google',
  })
  assert.equal(opened.statusCode, 201, opened.body)
  const { url: address, signInId } = Object(opened.json())
  const state = String(new URL(address).searchParams.get('state'))
  const code = `http://localhost:51121/oauth-callback?state=${state}&code=c-1`
  const linked = await post(on.hub, on.ana, `${signIns}/${signInId}`, { code })
  assert.equal(linked.statusCode, 201, linked.body)
  const url = await created(on.hub, on.ana, on.assistant, {
    model: 'google/gemini-3.5-flash-lite',
    connections: [on.matriz],
  })
  const { say } = await talking(t, on.hub, on.ana, url)
  /** The tools the Hub declared in the last call it made to the proxy, by name. */
  function declared(): Record<string, { parameters: Record<string, unknown> }> {
    const sent = JSON.parse(readFileSync(join(double.control, 'body'), 'utf8'))
    return Object.fromEntries(
      sent.tools.map((one: { function: { name: string } }) => [one.function.name, one.function]),
    )
  }
  /** The body of the last call the Hub made to the proxy that offered tools, as sent. */
  function lastBody(): string {
    return readFileSync(join(double.control, 'body'), 'utf8')
  }
  /** The `propose_automation` results the conversation stored, in order. */
  async function proposed() {
    const messages = await messagesOf(on.hub, on.ana, url)
    return messages.flatMap((message) =>
      message.parts.flatMap((part) => {
        const call = Object(part).toolInvocation
        return call?.toolName === PROPOSE ? [call.result] : []
      }),
    )
  }
  return { ...on, say, declared, lastBody, proposed }
}

const DAYS = { kind: 'WEEKLY', time: '07:00', days: ['MON', 'WED'] }

test('sem união: no login do Google, o propose_automation chega ao proxy com o kind dos quatro valores, sem anyOf', async (t) => {
  const on = await onGoogle(t, 'google-propose-automation', 'google-thinking')
  assert.equal(endOf(await on.say('Toda segunda e quarta, resuma o giro de estoque')), 'complete')
  const { cadence, connections } = Object(on.declared()[PROPOSE]?.parameters.properties)
  assert.equal(cadence.anyOf, undefined)
  assert.deepEqual(cadence.properties.kind.enum, ['DAILY', 'WEEKDAYS', 'WEEKLY', 'MONTHLY'])
  assert.deepEqual(cadence.required, ['kind', 'time'])
  assert.deepEqual(connections.items.enum, ['Matriz'])
})

test('a chamada achatada que o Gemini gravou vira o cartão com o Cadence certo, na forma da união', async (t) => {
  const on = await onGoogle(t, 'google-propose-automation', 'google-thinking')
  assert.equal(endOf(await on.say('Toda segunda e quarta, resuma o giro de estoque')), 'complete')
  const [result] = await on.proposed()
  const card = ProposedAutomation.parse(result)
  assert.deepEqual(card.cadence, DAYS)
  assert.deepEqual(card.connections, [on.matriz])
})

test('um WEEKLY sem dias (a gravação real com os dias tirados à mão) volta ao modelo com cadence.days, e o turno segue', async (t) => {
  const on = await onGoogle(
    t,
    'google-propose-automation-weekly-no-days',
    'google-propose-automation',
    'google-thinking',
  )
  assert.equal(endOf(await on.say('Toda segunda e quarta, resuma o giro de estoque')), 'complete')
  assert.match(on.lastBody(), /cadence\.days/)
  assert.deepEqual(ProposedAutomation.parse((await on.proposed()).at(-1)).cadence, DAYS)
})

test('numa conta Claude, a mesma conversa recebe a união e guarda o mesmo cartão', async (t) => {
  const on = await assisting(t, [
    [
      tool(PROPOSE, {
        name: 'Giro',
        prompt: 'Resuma o giro.',
        cadence: DAYS,
        connections: ['Matriz'],
      }),
    ],
    [said('Pronto.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Toda segunda e quarta, resuma o giro')), 'complete')
  const { cadence } = Object(Object(on.calls[0]?.schemas[PROPOSE]).properties)
  assert.deepEqual(
    cadence.oneOf.map(
      (branch: { properties: { kind: { const: string } } }) => branch.properties.kind.const,
    ),
    ['DAILY', 'WEEKDAYS', 'WEEKLY', 'MONTHLY'],
  )
})
