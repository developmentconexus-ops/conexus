import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Manifest, versionFiles } from './index.ts'

const GOOD = {
  contract: 1,
  entry: 'worker.js',
  migrations: [{ id: '001_recado', statements: ['CREATE TABLE recado (id int)'] }],
  assets: ['index.html', 'css/app.css'],
}

/** The shapes a manifest held before decision 0055's amendment, as the versions sent then keep them. */
const STORED_OPERATIONS = {
  escrever: {
    input: {
      type: 'object',
      properties: { texto: { type: 'string', minLength: 1, maxLength: 500 } },
      required: ['texto'],
    },
    output: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
  },
}

function refuses(change: (manifest: typeof GOOD) => unknown) {
  const copy = structuredClone(GOOD)
  assert.equal(Manifest.safeParse(change(copy) ?? copy).success, false)
}

test('um manifesto do contrato 1 passa e diz os arquivos da pasta', () => {
  const manifest = Manifest.parse(GOOD)
  assert.deepEqual(versionFiles(manifest), ['worker.js', 'assets/index.html', 'assets/css/app.css'])
})

test('um manifesto guardado com operations segue válido, e nenhuma forma é lida', () => {
  assert.equal(Manifest.safeParse({ ...GOOD, operations: STORED_OPERATIONS }).success, true)
  assert.equal(Manifest.safeParse({ ...GOOD, operations: {} }).success, true)
  const unread = { escrever: { input: { type: 'date' } }, outra: 'qualquer' }
  assert.equal(Manifest.safeParse({ ...GOOD, operations: unread }).success, true)
})

test('recusa contract diferente de 1 e campo a mais', () => {
  refuses((m) => ({ ...m, contract: 2 }))
  refuses((m) => ({ ...m, extra: true }))
})

test('recusa caminho absoluto, com .., repetido, e entrada que não é .js', () => {
  refuses((m) => ({ ...m, assets: ['/index.html'] }))
  refuses((m) => ({ ...m, assets: ['../index.html'] }))
  refuses((m) => ({ ...m, assets: ['a/./b.css'] }))
  refuses((m) => ({ ...m, assets: ['index.html', 'index.html'] }))
  refuses((m) => ({ ...m, entry: 'worker.ts' }))
})

test('recusa comando que encerra, divide ou reconfigura a transação das migrações', () => {
  for (const statement of [
    'COMMIT',
    'rollback',
    'BEGIN',
    'START TRANSACTION',
    'END',
    'SAVEPOINT a',
    'RELEASE SAVEPOINT a',
    "PREPARE TRANSACTION 'x'",
    'SET statement_timeout = 0',
    'set role postgres',
    'RESET ALL',
    'DISCARD ALL',
    '-- fim\nCOMMIT',
    '/* fim */ commit',
  ]) {
    refuses((m) => ({ ...m, migrations: [{ id: '001', statements: [statement] }] }))
  }
  const set =
    'CREATE FUNCTION f() RETURNS int LANGUAGE sql SET search_path = pg_catalog AS $$ SELECT 1 $$'
  assert.equal(
    Manifest.safeParse({ ...GOOD, migrations: [{ id: '001', statements: [set, 'SELECT 1'] }] })
      .success,
    true,
  )
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
