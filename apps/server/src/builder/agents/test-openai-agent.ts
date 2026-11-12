import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { ATTEMPT_KEY_HEADER } from '@conexus/hub-api'
import { z } from 'zod'
import { call, post } from '../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Codex } from '../../platform/test-openai-codex.ts'
import { plantCodex } from '../../platform/test-openai-codex.ts'
import { recordedBody } from '../../platform/test-recordings.ts'
import { approving } from './test-approval.ts'

const Sent = z.object({
  stream: z.boolean().optional(),
  tools: z.array(z.unknown()).optional(),
  input: z.array(z.unknown()),
})

/** A call of the turn: the Hub's title call goes streamed too, but carries no tools. */
function ofTurn(sent: z.infer<typeof Sent>): boolean {
  return sent.stream === true && (sent.tools?.length ?? 0) > 0
}
const Output = z.looseObject({
  type: z.literal('function_call_output'),
  call_id: z.string(),
  output: z.string(),
})

/**
 * The Codex endpoint answers the streamed calls of a turn with `names`, recordings of the ChatGPT
 * subscription's own stream, in order (T24). A call without tools is the Hub's title call, which
 * the double leaves to its default; a call of the turn past the last recording fails the test.
 */
function playing(codex: Codex, names: readonly string[]) {
  const left = [...names]
  codex.responses = (body) => {
    if (!ofTurn(Sent.parse(JSON.parse(body)))) return { status: 500 }
    const name = left.shift()
    if (name === undefined) throw new Error('The turn asked the model more often than recorded.')
    return { status: 200, stream: recordedBody(name) }
  }
}

/**
 * The write agents of `approving` (Ana, her Sankhya double, `Lançar pedido` fixed) with the company's
 * model the ChatGPT subscription's `openai/gpt-5.6-luna`, signed in on the vendor's double, which plays
 * `recordings` in order. `outputs` are the `function_call_output` items of the last request of the turn
 * the Hub streamed to the model, the failure a refused tool sends back.
 */
export async function approvingOnOpenai(t: TestContext, recordings: readonly string[]) {
  const codex = plantCodex(t)
  codex.typed = true
  playing(codex, recordings)
  const on = await approving(t, [])
  await on.hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'openai_codex')`,
    [on.companyId],
  )
  const signIns = `${on.company}/model-account-sign-ins`
  const started = await post(on.hub, on.ana, signIns, {
    owner: 'company',
    kind: 'openai_codex',
    label: 'Assinatura',
  })
  assert.equal(started.statusCode, 201, started.body)
  const polled = await on.hub.app.inject({
    method: 'POST',
    url: `${signIns}/${String(Object(started.json()).signInId)}/poll`,
    headers: { origin: TEST_ORIGIN, cookie: on.ana.cookie, [ATTEMPT_KEY_HEADER]: randomUUID() },
  })
  assert.equal(polled.statusCode, 200, polled.body)
  assert.equal(Object(polled.json()).status, 'linked')
  const model = { model: 'openai/gpt-5.6-luna', effort: 'low' }
  assert.equal(
    (await call(on.hub, on.ana, 'PUT', `${on.company}/default-model`, model)).statusCode,
    200,
  )
  function outputs() {
    const streamed = codex.calls
      .filter((made) => made.endpoint === 'responses')
      .map((made) => Sent.parse(JSON.parse(made.body)))
      .filter(ofTurn)
    return (streamed.at(-1)?.input ?? []).flatMap((item) => {
      const output = Output.safeParse(item)
      return output.success ? [output.data] : []
    })
  }
  return { ...on, codex, outputs }
}
