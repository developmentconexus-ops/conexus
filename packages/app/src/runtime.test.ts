import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AppProps, ConnectorAnswer, Connectors, Db } from '@conexus/app-contract'
import { ConnectorAnswer as Answer, serveApp } from '@conexus/app-contract'
import { z } from 'zod'
import { connectorsOf, defineConnectors, defineHandlers, defineOperations } from './index.ts'

const operations = defineOperations({
  escrever: { input: z.object({ texto: z.string().min(1) }), output: z.object({ id: z.int() }) },
  curto: { input: z.object({}), output: z.object({ texto: z.string().max(3) }) },
  quebrar: { input: z.object({}), output: z.object({}) },
})

const DB: Db = { query: async () => ({ rows: [] }), batch: async () => ({ results: [] }) }
const PROPS: AppProps = {
  caller: {
    personId: 'p',
    personName: 'Ana',
    projectId: 'j',
    projectName: 'Pedidos',
    access: { kind: 'BUILDER' },
  },
  db: DB,
  connectors: {
    call: async () => ({ kind: 'NOT_GRANTED' }),
    connections: async () => ({ kind: 'OK', names: [] }),
  },
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

const NATIVE = { status: 403, code: 'NO_ACCESS', message: 'Sem permissão' }
const ANSWERS: readonly ConnectorAnswer[] = [
  { kind: 'OK', value: { linhas: [{ N: 1 }], completo: true } },
  { kind: 'OK', value: { linhas: [], temMais: false }, empty: true },
  { kind: 'NOT_GRANTED' },
  { kind: 'REFUSED', native: NATIVE },
  { kind: 'AUTH_REFUSED', native: { ...NATIVE, status: 401 } },
  { kind: 'UNREADABLE', native: { status: 200, code: '4', message: null } },
  { kind: 'BUSY', waitMs: 1_500 },
  { kind: 'BUSY', waitMs: null },
  { kind: 'UNREACHABLE' },
  { kind: 'DEADLINE' },
]

test('a resposta do conector chega ao handler pelo cliente como veio, e nenhuma leva o body do fornecedor', async () => {
  const declared = defineConnectors({ sankhya: ['consultar'], 'mercado-livre': ['perguntas'] })
  const reading = defineOperations({ ler: { input: z.object({}), output: z.unknown() } })
  const sent: unknown[][] = []
  for (const given of ANSWERS) {
    const connectors: Connectors = {
      call: async (...args) => {
        sent.push(args)
        return given
      },
      connections: async (connector) => ({ kind: 'OK', names: [`${connector} loja 1`] }),
    }
    const served = serveApp({
      operations: reading,
      handlers: defineHandlers(reading, {
        ler: async (_input, context) => {
          const client = connectorsOf(context, declared)
          const stores = await client['mercado-livre'].connections()
          const [loja = ''] = stores.kind === 'OK' ? stores.names : []
          await client['mercado-livre'].perguntas({ offset: 0, limit: 50 }, loja)
          return client.sankhya.consultar({ sql: 'SELECT 1 FROM TSIEMP' })
        },
      }),
    })
    const init = { method: 'POST', body: '{}' }
    const props = { ...PROPS, connectors }
    const response = await served.fetch(
      new Request('https://app.example/api/ler', init),
      {},
      { props },
    )
    assert.deepEqual(await response.json(), given, given.kind)
  }
  assert.deepEqual(sent.slice(0, 2), [
    ['mercado-livre', 'perguntas', { offset: 0, limit: 50 }, 'mercado-livre loja 1'],
    ['sankhya', 'consultar', { sql: 'SELECT 1 FROM TSIEMP' }, undefined],
  ])
  const withBody = { kind: 'REFUSED', native: { ...NATIVE, body: { segredo: 'da empresa' } } }
  assert.equal(Answer.safeParse(withBody).success, false, 'the contract has no body')
  for (const given of ANSWERS) assert.equal(Answer.safeParse(given).success, true, given.kind)
})
