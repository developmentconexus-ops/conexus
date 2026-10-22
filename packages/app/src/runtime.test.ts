import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AppProps, Db } from '@conexus/app-contract'
import { serveApp } from '@conexus/app-contract'
import { z } from 'zod'
import { defineHandlers, defineOperations, manifestOf } from './index.ts'

const operations = defineOperations({
  escrever: { input: z.object({ texto: z.string().min(1) }), output: z.object({ id: z.int() }) },
  curto: { input: z.object({}), output: z.object({ texto: z.string().max(3) }) },
  quebrar: { input: z.object({}), output: z.object({}) },
})

const DB: Db = { query: async () => ({ rows: [] }), batch: async () => ({ results: [] }) }
const PROPS: AppProps = {
  caller: { personId: 'p', personName: 'Ana', projectId: 'j', projectName: 'Pedidos' },
  db: DB,
}

function appOf(withOperations: boolean) {
  const manifest = manifestOf({
    operations: withOperations ? operations : undefined,
    migrations: [],
    assets: [],
  })
  assert.equal(manifest.ok, true)
  const handlers = withOperations
    ? defineHandlers(operations, {
        escrever: ({ texto }) => ({ id: texto.length }),
        curto: () => ({ texto: 'longo demais' }),
        quebrar: () => {
          throw new Error('segredo da empresa')
        },
      })
    : {}
  return serveApp({ manifest: manifest.ok ? manifest.value : undefined, handlers })
}

function call(app: ReturnType<typeof serveApp>, name: string, body: unknown) {
  const init = { method: 'POST', body: JSON.stringify(body) }
  return app.fetch(new Request(`https://app.example/api/${name}`, init), {}, { props: PROPS })
}

test('o handler recebe a entrada tipada pelo Zod e a resposta passa pela saída', async () => {
  const response = await call(appOf(true), 'escrever', { texto: 'oi' })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { id: 2 })
})

test('entrada fora da forma: 400 INPUT_INVALID', async () => {
  for (const body of [{ texto: '' }, { texto: 'oi', a_mais: 1 }, {}, 'texto']) {
    const response = await call(appOf(true), 'escrever', body)
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { code: 'INPUT_INVALID' })
  }
})

test('saída fora da forma: 500 OUTPUT_INVALID, sem o valor', async () => {
  const response = await call(appOf(true), 'curto', {})
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { code: 'OUTPUT_INVALID' })
})

test('o que lança: 500 HANDLER_FAILED, sem a mensagem', async (t) => {
  t.mock.method(console, 'error', () => undefined)
  const response = await call(appOf(true), 'quebrar', {})
  assert.equal(response.status, 500)
  assert.equal(await response.text(), '{"code":"HANDLER_FAILED"}')
})

test('com zero operações todo /api responde 404 OPERATION_NOT_FOUND', async () => {
  const response = await call(appOf(false), 'escrever', { texto: 'oi' })
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { code: 'OPERATION_NOT_FOUND' })
})
