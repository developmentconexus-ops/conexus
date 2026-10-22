import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AppProps, Db } from '@conexus/app-contract'
import { serveApp } from '@conexus/app-contract'
import { z } from 'zod'
import { defineHandlers, defineOperations } from './index.ts'

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

const app = serveApp({
  operations,
  handlers: defineHandlers(operations, {
    escrever: ({ texto }) => ({ id: texto.length }),
    curto: () => ({ texto: 'longo demais' }),
    quebrar: () => {
      throw new Error('segredo da empresa')
    },
  }),
})

function call(served: ReturnType<typeof serveApp>, name: string, body: unknown) {
  const init = { method: 'POST', body: JSON.stringify(body) }
  return served.fetch(new Request(`https://app.example/api/${name}`, init), {}, { props: PROPS })
}

test('o handler recebe a entrada tipada pelo Zod e a resposta passa pela saída', async () => {
  const response = await call(app, 'escrever', { texto: 'oi' })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { id: 2 })
})

test('entrada fora da forma: 400 INPUT_INVALID', async () => {
  for (const body of [{ texto: '' }, {}, 'texto']) {
    const response = await call(app, 'escrever', body)
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { code: 'INPUT_INVALID' })
  }
})

test('saída fora da forma: 500 OUTPUT_INVALID, sem o valor', async () => {
  const response = await call(app, 'curto', {})
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { code: 'OUTPUT_INVALID' })
})

test('o que lança: 500 HANDLER_FAILED, sem a mensagem', async (t) => {
  t.mock.method(console, 'error', () => undefined)
  const response = await call(app, 'quebrar', {})
  assert.equal(response.status, 500)
  assert.equal(await response.text(), '{"code":"HANDLER_FAILED"}')
})

test('com zero operações todo /api responde 404 OPERATION_NOT_FOUND', async () => {
  const empty = serveApp({ operations: {}, handlers: {} })
  const response = await call(empty, 'escrever', { texto: 'oi' })
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { code: 'OPERATION_NOT_FOUND' })
})

// The Padaria Sol's order (card of step 14, criterion 3): an e-mail, a delivery date that travels
// as ISO text and arrives as a `Date`, a status with its default, a payment that is one of two kinds.
const isoDate = z.codec(z.iso.date(), z.date(), {
  decode: (text) => new Date(`${text}T00:00:00Z`),
  encode: (date) => date.toISOString().slice(0, 10),
})
const Encomenda = z.strictObject({
  id: z.uuid(),
  cliente: z.string().trim().min(1),
  email: z.email(),
  entrega: isoDate,
  situacao: z.enum(['aberta', 'entregue']).default('aberta'),
  pagamento: z.discriminatedUnion('tipo', [
    z.strictObject({ tipo: z.literal('pix') }),
    z.strictObject({ tipo: z.literal('cartao'), parcelas: z.int().min(1).max(12) }),
  ]),
})
const padaria = defineOperations({
  criarEncomenda: { input: Encomenda.omit({ id: true }), output: Encomenda },
})
const ID = '6f1c2a3e-1b2c-4d5e-8f90-123456789abc'
const padariaApp = serveApp({
  operations: padaria,
  handlers: defineHandlers(padaria, {
    criarEncomenda: (encomenda) => {
      assert.ok(encomenda.entrega instanceof Date)
      return { ...encomenda, id: ID }
    },
  }),
})
const PEDIDO = {
  cliente: '  Ana ',
  email: 'ana@padaria.example',
  entrega: '2026-11-03',
  pagamento: { tipo: 'cartao', parcelas: 3 },
}

test('a encomenda da Ana: 200, com a situação padrão e a data codificada; e-mail inválido: 400', async () => {
  const made = await call(padariaApp, 'criarEncomenda', PEDIDO)
  assert.equal(made.status, 200)
  assert.deepEqual(await made.json(), {
    ...PEDIDO,
    id: ID,
    cliente: 'Ana',
    situacao: 'aberta',
  })
  for (const wrong of [
    { ...PEDIDO, email: 'ana' },
    { ...PEDIDO, entrega: '2026-02-30' },
    { ...PEDIDO, pagamento: { tipo: 'pix', parcelas: 3 } },
  ]) {
    const refused = await call(padariaApp, 'criarEncomenda', wrong)
    assert.equal(refused.status, 400)
    assert.deepEqual(await refused.json(), { code: 'INPUT_INVALID' })
  }
})
