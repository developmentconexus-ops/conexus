import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { ATTEMPT_KEY_HEADER, CompanyId, ModelAccountId } from '@conexus/hub-api'
import { call, post } from '../../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../../platform/test-database.ts'
import {
  ACCESS,
  ACCOUNT_ID,
  plantCodex,
  RENEWED_ACCESS,
  RENEWED_REFRESH,
  titledStream,
} from '../../../platform/test-openai-codex.ts'
import { recordedBody } from '../../../platform/test-recordings.ts'
import { testOpened } from '../../../platform/test-seal.ts'
import { TITLE } from '../../controller-kit/public.ts'
import {
  asked,
  beside,
  conversing,
  endOf,
  sent,
  started,
  streamOf,
  turnNotices,
} from '../../conversation/test-conversation.ts'
import { failuresOf } from '../../conversation/test-parts.ts'
import { codexModel } from '../public.ts'

const MODEL = 'openai/gpt-5.2'
/** The Builder's title phrase as the request carries it inside the JSON body. */
const TITLE_PHRASE = JSON.stringify(TITLE.app.title).slice(1, -1)

/**
 * Empresa Teste with the ChatGPT subscription "ChatGPT" as the only OpenAI account and the default
 * model on it at `medium`; `expiresIn` is the lifetime the vendor gives the token at sign-in.
 */
async function subscribed(t: TestContext, expiresIn: number) {
  const base = await conversing(t, () => ({ kind: 'text', text: 'Pronto.' }))
  const codex = plantCodex(t)
  const { hub, ana, companyId } = base
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'openai_codex')`,
    [companyId],
  )
  const company = `/api/companies/${companyId}`
  const body = { owner: 'company', kind: 'openai_codex', label: 'ChatGPT' }
  const started = Object((await post(hub, ana, `${company}/model-account-sign-ins`, body)).json())
  codex.typed = true
  const exchange = codex.exchange
  codex.exchange = async () => {
    const reply = await exchange()
    return { ...reply, body: { ...Object(reply.body), expires_in: expiresIn } }
  }
  const poll = await hub.app.inject({
    method: 'POST',
    url: `${company}/model-account-sign-ins/${started.signInId}/poll`,
    headers: { origin: TEST_ORIGIN, cookie: ana.cookie, [ATTEMPT_KEY_HEADER]: randomUUID() },
  })
  assert.equal(poll.statusCode, 200, poll.body)
  codex.exchange = exchange
  const chosen = { model: MODEL, effort: 'medium' }
  assert.equal((await call(hub, ana, 'PUT', `${company}/default-model`, chosen)).statusCode, 200)
  async function states() {
    const read = Object((await call(hub, ana, 'GET', `${company}/model-accounts`)).json())
    const own = read.company.filter((each: { label: string }) => each.label === 'ChatGPT')
    return own.map((each: { label: string; state: string }) => [each.label, each.state])
  }
  const where = { hub, person: ana, conversations: base.conversations }
  return { ...base, codex, states, where, account: String(Object(poll.json()).account.id) }
}

type Subscribed = Awaited<ReturnType<typeof subscribed>>

function responses(f: Subscribed) {
  return f.codex.calls.filter((made) => made.endpoint === 'responses')
}

function renewals(f: Subscribed) {
  return f.codex.calls.filter((made) => made.endpoint === 'refresh')
}

test('o pedido que sai', async (t) => {
  const f = await subscribed(t, 3600)
  f.codex.responses = () => ({ status: 400 })
  await asked(t, f.where)
  const [made] = responses(f)
  assert.equal(made?.headers.get('authorization'), `Bearer ${ACCESS}`)
  assert.equal(made?.headers.get('chatgpt-account-id'), ACCOUNT_ID)
  assert.equal(made?.headers.get('originator'), 'conexus')
  const request = Object(JSON.parse(String(made?.body)))
  assert.equal(typeof request.prompt_cache_key, 'string')
  assert.ok(request.prompt_cache_key.length > 0)
  assert.equal(made?.headers.get('session-id'), request.prompt_cache_key)
  assert.equal(made?.headers.get('thread-id'), request.prompt_cache_key)
  assert.equal(request.store, false)
  assert.equal(typeof request.instructions, 'string')
  assert.match(request.instructions, /^You help people build and run business apps\./)
  assert.equal(request.reasoning.effort, 'medium')
  assert.ok(Array.isArray(request.input) && request.input.length > 0)
  for (const item of request.input) assert.equal('id' in item, false)
})

test('a conversa é a chave do cache: dois turnos dela mandam a mesma, outra conversa manda outra', async (t) => {
  const f = await subscribed(t, 3600)
  f.codex.responses = () => ({ status: 400 })
  const { hub, person, conversations } = f.where
  const url = `${conversations}/${await started(hub, person, conversations)}`
  const stream = await streamOf(hub, person, url)
  t.after(() => stream.close())
  for (const content of ['Primeiro', 'Segundo']) {
    assert.equal((await sent(hub, person, url, content)).statusCode, 200)
    await stream.turn()
  }
  await asked(t, await beside(f.where, 'Estoque'))
  const keys = responses(f).map((made) => Object(JSON.parse(String(made.body))).prompt_cache_key)
  assert.ok(keys.length >= 3)
  assert.equal(keys[0], keys[1])
  assert.notEqual(keys[0], keys.at(-1))
})

test('os itens de uma resposta anterior saem sem id', async (t) => {
  const codex = plantCodex(t)
  codex.responses = () => ({ status: 400 })
  const model = codexModel('gpt-5.2', { access: ACCESS, accountId: ACCOUNT_ID })
  await assert.rejects(async () =>
    model.doStream({
      prompt: [
        { role: 'user', content: [{ type: 'text', text: 'Oi' }] },
        {
          role: 'assistant',
          content: [
            {
              type: 'reasoning',
              text: '',
              providerOptions: {
                openai: { itemId: 'rs_planted', reasoningEncryptedContent: 'planted-encrypted' },
              },
            },
            { type: 'text', text: 'Olá.', providerOptions: { openai: { itemId: 'msg_planted' } } },
            {
              type: 'tool-call',
              toolCallId: 'call_planted',
              toolName: 'lookup',
              input: {},
              providerOptions: { openai: { itemId: 'fc_planted' } },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call_planted',
              toolName: 'lookup',
              output: { type: 'text', value: 'ok' },
            },
          ],
        },
        { role: 'user', content: [{ type: 'text', text: 'E agora?' }] },
      ],
    }),
  )
  const request = Object(JSON.parse(String(codex.calls[0]?.body)))
  const types = request.input.map(
    (item: { type?: string; role?: string }) => item.type ?? item.role,
  )
  assert.deepEqual(types, [
    'user',
    'reasoning',
    'assistant',
    'function_call',
    'function_call_output',
    'user',
  ])
  assert.deepEqual(
    request.input.filter((item: object) => 'id' in item),
    [],
  )
})

test('o transporte leva o mesmo texto fixo curto para todo modelo, sem regra de agente nem bloco de modelo', async (t) => {
  const codex = plantCodex(t)
  codex.responses = () => ({ status: 400 })
  const prompt = [{ role: 'user' as const, content: [{ type: 'text' as const, text: 'Oi' }] }]
  for (const name of ['gpt-6-luna', 'gpt-5.6-luna', 'gpt-5.2']) {
    const model = codexModel(name, { access: ACCESS, accountId: ACCOUNT_ID })
    await assert.rejects(async () => model.doStream({ prompt }))
  }
  const sent = codex.calls.map((made) => String(Object(JSON.parse(String(made.body))).instructions))
  assert.equal(new Set(sent).size, 1, 'one text for every model')
  assert.doesNotMatch(
    sent[0] ?? '',
    /autonomy_and_persistence|Reading is always allowed|failed read|ask the person/i,
  )
})

test('401 renova uma vez: o token novo vai, e um segundo 401 marca a conta recusada e o turno diz o nome', async (t) => {
  const f = await subscribed(t, 3600)
  f.codex.responses = () => ({ status: 401 })
  const { url, events } = await asked(t, f.where)
  assert.deepEqual(
    responses(f).map((made) => made.headers.get('authorization')),
    [`Bearer ${ACCESS}`, `Bearer ${RENEWED_ACCESS}`],
  )
  assert.equal(renewals(f).length, 1)
  assert.deepEqual(await turnNotices(f.hub, f.ana, url), ['ChatGPT foi recusada. Ligue de novo.'])
  assert.deepEqual(failuresOf(events), ['MODEL_NO_ACCOUNT'])
  assert.deepEqual(await f.states(), [['ChatGPT', 'refused']])
})

test('429 é limite: a conta ganha a hora que o Codex dá', async (t) => {
  const f = await subscribed(t, 3600)
  f.codex.responses = () => ({ status: 429, headers: { 'retry-after': '120' } })
  const begun = Date.now()
  await asked(t, f.where)
  const [row] = await f.hub.test.asOwner(
    `select limited_until, state from builder.model_account where label = 'ChatGPT'`,
  )
  const until = Object(row).limited_until
  assert.ok(until instanceof Date)
  const seconds = (until.getTime() - begun) / 1000
  assert.ok(seconds > 115 && seconds < 135, String(seconds))
  assert.equal(Object(row).state, 'ready')
})

test('renovação com duas conversas: uma só chamada, o token novo nas duas e o refresh novo selado', async (t) => {
  const f = await subscribed(t, 1)
  f.codex.responses = () => ({ status: 400 })
  const renewed = f.codex.refresh
  f.codex.refresh = async () => {
    await sleep(300)
    return renewed()
  }
  const turns = await Promise.all([asked(t, f.where), asked(t, await beside(f.where, 'Estoque'))])
  assert.equal(turns.length, 2)
  assert.equal(renewals(f).length, 1)
  const body = new URLSearchParams(renewals(f)[0]?.body)
  assert.equal(body.get('grant_type'), 'refresh_token')
  assert.ok(responses(f).length >= 2)
  for (const made of responses(f))
    assert.equal(made.headers.get('authorization'), `Bearer ${RENEWED_ACCESS}`)
  const [kept] = await f.hub.test.asOwner(
    `select sealed, key_id from builder.model_account where id = $1`,
    [f.account],
  )
  const context = {
    purpose: 'model-account',
    rowId: ModelAccountId.parse(f.account),
    companyId: CompanyId.parse(f.companyId),
    personId: null,
    kind: 'openai_codex',
    provider: 'openai',
  } as const
  const sealed = { keyId: String(Object(kept).key_id), blob: Object(kept).sealed }
  const credential = JSON.parse(testOpened(f.hub.config.sealKeys, context, sealed))
  assert.deepEqual([credential.refresh, credential.accountId], [RENEWED_REFRESH, ACCOUNT_ID])
})

test('renovação recusada: a conta fica recusada e o turno diz o nome', async (t) => {
  const f = await subscribed(t, 1)
  f.codex.refresh = () => ({ status: 400, body: { error: 'invalid_grant' } })
  const { url, events } = await asked(t, f.where)
  assert.equal(responses(f).length, 0)
  assert.equal(renewals(f).length, 1)
  assert.deepEqual(await turnNotices(f.hub, f.ana, url), ['ChatGPT foi recusada. Ligue de novo.'])
  assert.equal(endOf(events), 'error')
  assert.deepEqual(await f.states(), [['ChatGPT', 'refused']])
})

test('404 do Codex: o modelo não é atendido, a conta segue pronta e sem lista', async (t) => {
  const f = await subscribed(t, 3600)
  f.codex.responses = () => ({ status: 404 })
  await asked(t, f.where)
  assert.deepEqual(await f.states(), [['ChatGPT', 'ready']])
  const [row] = await f.hub.test.asOwner(
    `select served_models from builder.model_account where label = 'ChatGPT'`,
  )
  assert.equal(Object(row).served_models, null)
})

const SENTENCE = 'Não foi possível lançar o pedido: o produto **999 não existe**.'
const NAMED = 'Comparar apps de padaria'

test('o título da conversa pela assinatura: a chamada sem streaming sai com stream true, leva os avisos do Mastra antes da frase do assunto, e o texto juntado do SSE é o título gravado, sem erro no log', async (t) => {
  const f = await subscribed(t, 3600)
  f.codex.responses = (body) =>
    JSON.parse(body).stream === true
      ? {
          status: 200,
          stream: titledStream(recordedBody('openai-refused-write-closing'), SENTENCE, NAMED),
        }
      : { status: 400, body: { detail: 'Stream must be set to true' } }
  const { url } = await asked(t, f.where)
  let title: unknown = null
  for (let wait = 0; wait < 30 && title === null; wait++) {
    title = Object((await call(f.hub, f.ana, 'GET', url)).json()).conversation.title
    if (title === null) await sleep(100)
  }
  assert.equal(title, NAMED)
  for (const made of responses(f)) assert.equal(JSON.parse(String(made.body)).stream, true)
  const [asking, ...more] = responses(f).filter((made) => String(made.body).includes(TITLE_PHRASE))
  assert.ok(asking !== undefined && more.length === 0, 'one request carries the title phrase')
  const said = JSON.stringify(JSON.parse(String(asking.body)).input)
  for (const notice of [
    /transcrição de uma conversa/,
    /Nunca responda nem continue essa transcrição/,
    /usado como o título/,
  ])
    assert.match(said, notice)
  assert.ok(
    said.indexOf('Nunca responda') < said.indexOf('Dê à conversa um título curto'),
    'the notices come first',
  )
  assert.ok(!f.hub.lines.some((line) => line.message === 'MASTRA_ERROR'))
  assert.ok(!f.hub.lines.some((line) => line.message === 'MODEL_SIDE_CALL_FAILED'))
})
