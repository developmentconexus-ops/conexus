import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AppProps } from '@conexus/app-contract'
import { APP_FAILURE_CODES, serveApp } from '@conexus/app-contract'
import { z } from 'zod'
import {
  CallFailed,
  can,
  createApi,
  defineHandlers,
  defineOperations,
  failureText,
  readCaller,
} from './index.ts'

const operations = defineOperations({
  dobrar: { input: z.object({ n: z.int() }), output: z.object({ n: z.int() }) },
  quebrar: { input: z.object({}), output: z.object({}) },
})

const PROPS: AppProps = {
  caller: {
    personId: 'p',
    personName: 'Ana',
    projectId: 'j',
    projectName: 'Pedidos',
    access: { kind: 'BUILDER' },
  },
  db: { query: async () => ({ rows: [] }), batch: async () => ({ results: [] }) },
  connectors: { call: async () => ({ kind: 'NOT_GRANTED' }), connections: async () => [] },
}

function served() {
  const app = serveApp({
    operations,
    handlers: defineHandlers(operations, {
      dobrar: ({ n }) => ({ n: n * 2 }),
      quebrar: () => {
        throw new Error('segredo')
      },
    }),
  })
  return (url: string | URL | Request, init?: RequestInit) =>
    app.fetch(new Request(new URL(String(url), 'https://app.example'), init), {}, { props: PROPS })
}

test('a chamada devolve a saída conferida', async () => {
  const api = createApi(operations, served())
  assert.deepEqual(await api('dobrar', { n: 4 }), { n: 8 })
})

test('a falha do app vira CallFailed com o código e a frase em português', async (t) => {
  t.mock.method(console, 'error', () => undefined)
  const api = createApi(operations, served())
  await assert.rejects(api('quebrar', {}), (error) => {
    assert.ok(error instanceof CallFailed)
    assert.equal(error.code, 'HANDLER_FAILED')
    assert.equal(error.message, failureText.HANDLER_FAILED)
    return true
  })
  await assert.rejects(api('dobrar', { n: 1.5 }), { code: 'INPUT_INVALID' })
})

test('sem resposta do app, ou resposta que não é dele: UNREACHABLE', async () => {
  const offline = createApi(operations, async () => Promise.reject(new TypeError('fetch failed')))
  await assert.rejects(offline('dobrar', { n: 1 }), { code: 'UNREACHABLE' })
  const page = createApi(operations, async () => new Response('<h1>502</h1>', { status: 502 }))
  await assert.rejects(page('dobrar', { n: 1 }), { code: 'UNREACHABLE' })
})

test('uma saída fora do Zod do cliente: OUTPUT_INVALID', async () => {
  const wrong = createApi(operations, async () => Response.json({ n: 'oito' }))
  await assert.rejects(wrong('dobrar', { n: 4 }), { code: 'OUTPUT_INVALID' })
})

test('toda falha do contrato tem a sua frase', () => {
  assert.deepEqual(Object.keys(failureText).sort(), [...APP_FAILURE_CODES].sort())
  for (const text of Object.values(failureText)) assert.match(text, /\.$/)
})

test('quem chama e a frase do papel', async () => {
  const caller = await readCaller(served())
  assert.deepEqual(caller, { personName: 'Ana', access: { kind: 'BUILDER' } })
  assert.equal(can(caller.access, 'gerente'), true)
  assert.equal(can({ kind: 'USER', role: 'gerente' }, 'gerente'), true)
  assert.equal(can({ kind: 'USER', role: 'vendedor' }, 'gerente'), false)
  assert.equal(can({ kind: 'USER', role: null }, 'gerente'), false)
  const forbidden = createApi(operations, async () =>
    Response.json({ code: 'ROLE_FORBIDDEN' }, { status: 403 }),
  )
  await assert.rejects(forbidden('dobrar', { n: 1 }), {
    code: 'ROLE_FORBIDDEN',
    message: 'Seu papel neste app não permite isto.',
  })
})

function refusedBy(platform: Response) {
  return createApi(operations, async () => platform)
}

test('a recusa da plataforma recarrega a página', async (t) => {
  const reload = t.mock.fn()
  Object.defineProperty(globalThis, 'location', { value: { reload }, configurable: true })
  t.after(() => Reflect.deleteProperty(globalThis, 'location'))
  const redirected = Object.defineProperty(new Response(null), 'type', { value: 'opaqueredirect' })
  const seen: RequestInit[] = []
  const api = createApi(operations, async (_url, init) => {
    seen.push(init ?? {})
    return redirected
  })
  await assert.rejects(api('dobrar', { n: 1 }), { code: 'UNREACHABLE' })
  assert.equal(seen[0]?.redirect, 'manual')
  assert.equal(reload.mock.callCount(), 1)
  await assert.rejects(
    refusedBy(new Response('<h1>Sem acesso</h1>', { status: 403 }))('dobrar', { n: 1 }),
    {
      code: 'UNREACHABLE',
    },
  )
  assert.equal(reload.mock.callCount(), 2)
  await assert.rejects(
    refusedBy(new Response('<h1>503</h1>', { status: 503 }))('dobrar', { n: 1 }),
    {
      code: 'UNREACHABLE',
    },
  )
  assert.equal(reload.mock.callCount(), 2)
})
