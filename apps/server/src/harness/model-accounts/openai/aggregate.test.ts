import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { codexModel } from '../public.ts'

const TOKENS = { access: 'access-token', accountId: 'account-1' }

function sse(...events: unknown[]): string {
  return events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('')
}

/** What the model's `doGenerate` makes of one streamed answer; the request it sent is `sent`. */
async function generated(t: TestContext, answer: string) {
  const sent: { headers: Headers; body: unknown }[] = []
  t.mock.method(globalThis, 'fetch', (_url: unknown, init?: RequestInit) => {
    sent.push({ headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) })
    return Promise.resolve(
      new Response(answer, { status: 200, headers: { 'content-type': 'text/event-stream' } }),
    )
  })
  const model = codexModel('gpt-5.2', TOKENS)
  const result = await model.doGenerate({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'Oi' }] }],
  })
  return { result, sent }
}

const created = { type: 'response.created', response: { id: 'resp_1', status: 'in_progress' } }
function completed(output?: unknown[]) {
  return {
    type: 'response.completed',
    response: { id: 'resp_1', status: 'completed', ...(output === undefined ? {} : { output }) },
  }
}

function message(text: string) {
  return {
    type: 'message',
    id: 'msg_1',
    role: 'assistant',
    content: [{ type: 'output_text', text, annotations: [] }],
  }
}

function texts(result: Awaited<ReturnType<typeof generated>>['result']) {
  return result.content.flatMap((part) => (part.type === 'text' ? [part.text] : []))
}

test('a chamada sem streaming sai com stream true e Accept de eventos', async (t) => {
  const { sent } = await generated(
    t,
    sse(
      created,
      { type: 'response.output_item.done', output_index: 0, item: message('Oi') },
      completed(),
    ),
  )
  assert.equal(sent.length, 1)
  assert.equal(Object(sent[0]?.body).stream, true)
  assert.equal(sent[0]?.headers.get('accept'), 'text/event-stream')
})

test('o texto vem dos itens de saída quando o response.completed não traz saída', async (t) => {
  const { result } = await generated(
    t,
    sse(
      created,
      { type: 'response.output_item.done', output_index: 0, item: message('Do item.') },
      completed(),
    ),
  )
  assert.deepEqual(texts(result), ['Do item.'])
})

test('o item de saída que chega depois vale mais que o que chegou antes, na posição dele', async (t) => {
  const { result } = await generated(
    t,
    sse(
      created,
      { type: 'response.output_item.added', output_index: 0, item: message('') },
      { type: 'response.output_item.done', output_index: 0, item: message('Pronto.') },
      completed(),
    ),
  )
  assert.deepEqual(texts(result), ['Pronto.'])
})

test('o texto vem dos deltas quando o item fechou sem ele', async (t) => {
  const { result } = await generated(
    t,
    sse(
      created,
      { type: 'response.output_item.added', output_index: 0, item: message('') },
      { type: 'response.output_text.delta', output_index: 0, content_index: 0, delta: 'Olá, ' },
      { type: 'response.output_text.delta', output_index: 0, content_index: 0, delta: 'mundo.' },
      { type: 'response.output_item.done', output_index: 0, item: message('') },
      completed(),
    ),
  )
  assert.deepEqual(texts(result), ['Olá, mundo.'])
})

test('sem itens, vale a saída do response.completed', async (t) => {
  const { result } = await generated(t, sse(created, completed([message('Do snapshot.')])))
  assert.deepEqual(texts(result), ['Do snapshot.'])
})

for (const type of ['response.failed', 'response.error', 'error']) {
  test(`o evento ${type} lança, mesmo com a resposta completa depois`, async (t) => {
    await assert.rejects(
      generated(
        t,
        sse(
          created,
          { type, response: { error: { message: 'cota acabou' } } },
          completed([message('Não devia valer.')]),
        ),
      ),
      /Codex stream error.*cota acabou/,
    )
  })
}

test('um evento malformado lança, e um corpo que não é objeto é só manutenção da conexão', async (t) => {
  await assert.rejects(
    generated(t, `data: {"type": "response.created"\n\n${sse(completed())}`),
    SyntaxError,
  )
  const { result } = await generated(
    t,
    `: keep-alive\n\ndata: [DONE]\n\ndata: ping\n\n${sse(created, completed([message('Ok.')]))}`,
  )
  assert.deepEqual(texts(result), ['Ok.'])
})

test('um stream sem resposta lança', async (t) => {
  await assert.rejects(
    generated(t, sse({ type: 'response.output_text.delta', output_index: 0, delta: 'x' })),
    /ended without a response/,
  )
})
