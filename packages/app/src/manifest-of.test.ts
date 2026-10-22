import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Manifest } from '@conexus/app-contract'
import { z } from 'zod'
import { defineOperations, manifestOf } from './index.ts'

const NONE = { migrations: [], assets: [] }

function refusedAt(shape: z.ZodType) {
  const result = manifestOf({
    operations: defineOperations({ salvar: { input: shape, output: z.object({}) } }),
    ...NONE,
  })
  assert.equal(result.ok, false)
  return result.ok ? undefined : result.error
}

test('as operações em Zod viram o manifesto que o Hub aceita', () => {
  const result = manifestOf({
    operations: defineOperations({
      listar: {
        input: z.object({ busca: z.string().max(40).optional() }),
        output: z.array(
          z.object({
            id: z.int(),
            cliente: z.string().min(1),
            situacao: z.enum(['aberta', 'entregue']),
            nota: z.string().nullable(),
            itens: z.array(z.number().min(0).max(99)).max(10),
          }),
        ),
      },
      salvar: {
        input: z.strictObject({ cliente: z.string() }),
        output: z.object({ id: z.int().min(1) }),
      },
    }),
    migrations: [{ id: '001_encomenda', statements: ['CREATE TABLE encomenda (id int)'] }],
    assets: ['index.html'],
  })
  assert.equal(result.ok, true)
  assert.deepEqual(result.ok && result.value.operations, {
    listar: {
      input: { type: 'object', properties: { busca: { type: 'string', maxLength: 40 } } },
      output: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            cliente: { type: 'string', minLength: 1 },
            situacao: { type: 'string', enum: ['aberta', 'entregue'] },
            nota: { type: 'string', nullable: true },
            itens: {
              type: 'array',
              items: { type: 'number', minimum: 0, maximum: 99 },
              maxItems: 10,
            },
          },
          required: ['id', 'cliente', 'situacao', 'nota', 'itens'],
        },
      },
    },
    salvar: {
      input: { type: 'object', properties: { cliente: { type: 'string' } }, required: ['cliente'] },
      output: {
        type: 'object',
        properties: { id: { type: 'integer', minimum: 1 } },
        required: ['id'],
      },
    },
  })
  assert.equal(result.ok && Manifest.safeParse(result.value).success, true)
})

test('sem operações é um app sem servidor: zero operações, entrada worker.js', () => {
  for (const operations of [undefined, {}]) {
    const result = manifestOf({ operations, ...NONE })
    assert.deepEqual(result.ok && [result.value.operations, result.value.entry], [{}, 'worker.js'])
  }
})

test('uma forma que o manifesto não diz é recusada com a operação e o caminho', () => {
  const object = z.object({ a: z.string() })
  const cases: [z.ZodType, string[]][] = [
    [z.object({ dado: z.union([object, z.object({ b: z.string() })]) }), ['input', 'dado']],
    [z.object({ n: z.string().transform((text) => text.length) }), ['input', 'n']],
    [
      z.object({ lista: z.array(z.object({ x: z.string().default('a') })) }),
      ['input', 'lista', '[]', 'x'],
    ],
    [z.object({ mail: z.string().refine((text) => text.includes('@')) }), ['input', 'mail']],
    [z.object({ mail: z.string().email() }), ['input', 'mail']],
    [z.object({ quando: z.date() }), ['input', 'quando']],
    [z.object({ lista: z.array(z.string()).min(1) }), ['input', 'lista']],
    [z.object({ tipo: z.literal('a') }), ['input', 'tipo']],
  ]
  for (const [shape, path] of cases) {
    assert.deepEqual(refusedAt(shape), {
      code: 'MANIFEST_SHAPE_UNSUPPORTED',
      operation: 'salvar',
      path,
    })
  }
})

test('a saída também é conferida', () => {
  const result = manifestOf({
    operations: defineOperations({
      ler: { input: z.object({}), output: z.object({ a: z.union([z.string(), z.number()]) }) },
    }),
    ...NONE,
  })
  assert.deepEqual(!result.ok && result.error, {
    code: 'MANIFEST_SHAPE_UNSUPPORTED',
    operation: 'ler',
    path: ['output', 'a'],
  })
})

test('o que o Manifest recusa vira MANIFEST_INVALID com o caminho: 33 operações, nome ruim', () => {
  const operation = { input: z.object({}), output: z.object({}) }
  const many = Object.fromEntries(Array.from({ length: 33 }, (_, at) => [`op${at}`, operation]))
  assert.deepEqual(manifestOf({ operations: many, ...NONE }), {
    ok: false,
    error: { code: 'MANIFEST_INVALID', path: ['operations'] },
  })
  assert.deepEqual(manifestOf({ operations: { '1ruim': operation }, ...NONE }), {
    ok: false,
    error: { code: 'MANIFEST_INVALID', path: ['operations', '1ruim'] },
  })
})
