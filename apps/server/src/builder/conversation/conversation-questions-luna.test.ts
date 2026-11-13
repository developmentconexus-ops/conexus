import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { ATTEMPT_KEY_HEADER } from '@conexus/hub-api'
import { call, post } from '../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { ofTurn, plantCodex } from '../../platform/test-openai-codex.ts'
import { recordedBody } from '../../platform/test-recordings.ts'
import {
  answeredOf,
  conversing,
  endOf,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { answerTo, invocations, untilCard } from './test-questions.ts'

/**
 * What the model sends under OpenAI's strict mode: Mastra's schema compat makes each optional field
 * of `ask_user` nullable and required, so the model fills what it does not use with `null`.
 */
const LUNA_ARGS = {
  questions: [
    {
      question: 'Quem cadastra as encomendas?',
      header: null,
      options: [
        { label: 'Todos (recomendado)', description: null },
        { label: 'Só eu', description: null },
      ],
      multiSelect: false,
    },
    { question: 'Quais dias?', header: 'Dias', options: null, multiSelect: null },
  ],
}

/**
 * The stream of a recorded Luna call (T24) with the call's name and arguments swapped for the
 * `ask_user` ones: every other event stays as the ChatGPT endpoint sent it.
 */
function lunaAsking(args: object): Buffer {
  const json = JSON.stringify(args)
  let deltas = 0
  const events = recordedBody('openai-refused-write-call')
    .toString('utf8')
    .split('\n\n')
    .flatMap((block) => {
      const [, data] = /^data: (.*)$/m.exec(block) ?? []
      if (data === undefined) return [block]
      const event = JSON.parse(data)
      if (event.type === 'response.function_call_arguments.delta') {
        deltas += 1
        return deltas === 1
          ? [`event: ${event.type}\ndata: ${JSON.stringify({ ...event, delta: json })}`]
          : []
      }
      if (event.type === 'response.function_call_arguments.done') {
        return [`event: ${event.type}\ndata: ${JSON.stringify({ ...event, arguments: json })}`]
      }
      if (event.item?.type === 'function_call') {
        const item = { ...event.item, name: 'ask_user' }
        if (item.arguments !== '') item.arguments = json
        return [`event: ${event.type}\ndata: ${JSON.stringify({ ...event, item })}`]
      }
      return [block]
    })
  return Buffer.from(events.join('\n\n'))
}

test('ask_user do GPT Luna: os argumentos guardados chegam à tela com `null`, o cartão aberto vem limpo e as respostas ficam certas', async (t) => {
  const codex = plantCodex(t)
  codex.typed = true
  const streams = [lunaAsking(LUNA_ARGS), recordedBody('openai-refused-write-closing')]
  codex.responses = (body) => {
    if (!ofTurn(body)) return { status: 500 }
    const stream = streams.shift()
    if (stream === undefined) throw new Error('The turn asked the model more often than recorded.')
    return { status: 200, stream }
  }
  const { hub, ana, companyId, conversations } = await conversing(
    t,
    (asked) =>
      title(asked) ?? {
        kind: 'text',
        text: 'Pronto.',
      },
  )
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'openai_codex')`,
    [companyId],
  )
  const company = `/api/companies/${companyId}`
  const signIns = `${company}/model-account-sign-ins`
  const begun = await post(hub, ana, signIns, {
    owner: 'company',
    kind: 'openai_codex',
    label: 'Assinatura',
  })
  assert.equal(begun.statusCode, 201, begun.body)
  const polled = await hub.app.inject({
    method: 'POST',
    url: `${signIns}/${String(Object(begun.json()).signInId)}/poll`,
    headers: { origin: TEST_ORIGIN, cookie: ana.cookie, [ATTEMPT_KEY_HEADER]: randomUUID() },
  })
  assert.equal(polled.statusCode, 200, polled.body)
  const model = { model: 'openai/gpt-5.6-luna', effort: 'low' }
  assert.equal((await call(hub, ana, 'PUT', `${company}/default-model`, model)).statusCode, 200)

  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Crie um app de encomendas')).statusCode, 200)

  const { card } = await untilCard(stream, 'question')
  const open = JSON.stringify(card.suspendPayload)
  assert.ok(!open.includes('null'), `the card Mastra suspends with is clean: ${open}`)

  const answers = ['Só eu', ['Seg', 'Ter']]
  const reply = await answerTo(hub, ana, url, card.toolCallId, { kind: 'answers', answers })
  assert.equal(reply.statusCode, 200, reply.body)
  assert.equal(endOf(await stream.turn()), 'complete')

  const read = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  const [kept] = invocations(read, card.toolCallId)
  assert.deepEqual(
    kept?.args,
    LUNA_ARGS,
    'the screen reads the arguments as the model sent them, `null` included',
  )
  assert.deepEqual(Object(kept?.result).answers, answers)
})
