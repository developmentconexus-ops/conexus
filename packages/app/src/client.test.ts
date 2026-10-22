import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AppProps } from '@conexus/app-contract'
import { APP_FAILURE_CODES, serveApp } from '@conexus/app-contract'
import { z } from 'zod'
import {
  CallFailed,
  createApi,
  defineHandlers,
  defineOperations,
  failureText,
  manifestOf,
} from './index.ts'

const operations = defineOperations({
  dobrar: { input: z.object({ n: z.int() }), output: z.object({ n: z.int() }) },
  quebrar: { input: z.object({}), output: z.object({}) },
})

const PROPS: AppProps = {
  caller: { personId: 'p', personName: 'Ana', projectId: 'j', projectName: 'Pedidos' },
  db: { query: async () => ({ rows: [] }), batch: async () => ({ results: [] }) },
}

function served() {
  const manifest = manifestOf({ operations, migrations: [], assets: [] })
  assert.equal(manifest.ok, true)
  const app = serveApp({
    manifest: manifest.ok ? manifest.value : undefined,
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
