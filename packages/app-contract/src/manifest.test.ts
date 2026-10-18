import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Manifest, versionFiles } from './index.ts'

const GOOD = {
  contract: 1,
  entry: 'worker.js',
  operations: {
    listar: {
      input: { type: 'object', properties: {} },
      output: {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'integer' }, texto: { type: 'string', maxLength: 500 } },
          required: ['id', 'texto'],
        },
      },
    },
    escrever: {
      input: {
        type: 'object',
        properties: { texto: { type: 'string', minLength: 1, maxLength: 500 } },
        required: ['texto'],
      },
      output: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
    },
  },
  migrations: [{ id: '001_recado', statements: ['CREATE TABLE recado (id int)'] }],
  assets: ['index.html', 'css/app.css'],
}

function refuses(change: (manifest: typeof GOOD) => unknown) {
  const copy = structuredClone(GOOD)
  assert.equal(Manifest.safeParse(change(copy) ?? copy).success, false)
}

test('um manifesto do contrato 1 passa e diz os arquivos da pasta', () => {
  const manifest = Manifest.parse(GOOD)
  assert.deepEqual(versionFiles(manifest), ['worker.js', 'assets/index.html', 'assets/css/app.css'])
})

test('null é declarável numa forma', () => {
  const copy = structuredClone(GOOD)
  Object.assign(copy.operations.escrever.output.properties, {
    nota: { type: 'string', nullable: true },
  })
  assert.equal(Manifest.safeParse(copy).success, true)
})

test('recusa contract diferente de 1', () => {
  refuses((m) => ({ ...m, contract: 2 }))
})

test('recusa campo a mais no manifesto, na operação e na forma', () => {
  refuses((m) => ({ ...m, extra: true }))
  refuses((m) => {
    Object.assign(m.operations.listar, { handler: 'x' })
  })
  refuses((m) => {
    Object.assign(m.operations.escrever.input, { additionalProperties: true })
  })
})

test('recusa operação sem forma, forma desconhecida e required sem a propriedade', () => {
  refuses((m) => ({ ...m, operations: { listar: { input: GOOD.operations.listar.input } } }))
  refuses((m) => ({ ...m, operations: {} }))
  refuses((m) => {
    Object.assign(m.operations.listar, { input: { type: 'date' } })
  })
  refuses((m) => {
    m.operations.escrever.input.required = ['outro']
  })
})

test('recusa forma com mais de seis níveis', () => {
  let shape: unknown = { type: 'string' }
  for (let level = 0; level < 6; level += 1) shape = { type: 'array', items: shape }
  refuses((m) => {
    Object.assign(m.operations.listar, { output: shape })
  })
})

test('recusa caminho absoluto, com .., repetido, e entrada que não é .js', () => {
  refuses((m) => ({ ...m, assets: ['/index.html'] }))
  refuses((m) => ({ ...m, assets: ['../index.html'] }))
  refuses((m) => ({ ...m, assets: ['a/./b.css'] }))
  refuses((m) => ({ ...m, assets: ['index.html', 'index.html'] }))
  refuses((m) => ({ ...m, entry: 'worker.ts' }))
})

test('recusa migração sem comando e ids repetidos', () => {
  refuses((m) => ({ ...m, migrations: [{ id: '001', statements: [] }] }))
  refuses((m) => ({
    ...m,
    migrations: [
      { id: '001', statements: ['SELECT 1'] },
      { id: '001', statements: ['SELECT 2'] },
    ],
  }))
})
