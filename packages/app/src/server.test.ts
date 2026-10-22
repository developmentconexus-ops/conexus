import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Db, Statement } from '@conexus/app-contract'
import { z } from 'zod'
import { DatabaseRefused, query, write } from './index.ts'

const Row = z.strictObject({ id: z.int(), texto: z.string() })

function dbOf(answers: {
  query?: unknown
  batch?: unknown
}): Db & { batches: (readonly Statement[])[] } {
  const batches: (readonly Statement[])[] = []
  return {
    batches,
    query: async () => z.custom<Awaited<ReturnType<Db['query']>>>().parse(answers.query),
    batch: async (statements) => {
      batches.push(statements)
      return z.custom<Awaited<ReturnType<Db['batch']>>>().parse(answers.batch)
    },
  }
}

test('query devolve as linhas conferidas pelo Zod', async () => {
  const db = dbOf({ query: { rows: [{ id: 1, texto: 'a' }] } })
  assert.deepEqual(await query(db, Row, 'SELECT id, texto FROM recado'), [{ id: 1, texto: 'a' }])
})

test('linha que não confere com o Zod lança', async () => {
  const db = dbOf({ query: { rows: [{ id: '1', texto: 'a' }] } })
  await assert.rejects(query(db, Row, 'SELECT 1'), z.ZodError)
})

test('o banco que recusa vira DatabaseRefused com o SQLSTATE e mais nada', async () => {
  const db = dbOf({ query: { error: { code: '42P01' } }, batch: { error: { code: '23505' } } })
  await assert.rejects(query(db, Row, 'SELECT secreto FROM tabela', ['valor']), (error) => {
    assert.ok(error instanceof DatabaseRefused)
    assert.equal(error.code, '42P01')
    assert.equal(error.message, '42P01')
    return true
  })
  await assert.rejects(
    write(db, [{ text: 'INSERT INTO t VALUES ($1)', values: ['valor'] }]),
    (error) => {
      assert.ok(error instanceof DatabaseRefused && error.message === '23505')
      return true
    },
  )
})

test('write manda todos os comandos num só db.batch e devolve as linhas de cada um', async () => {
  const db = dbOf({ batch: { results: [{ rows: [{ id: 1 }] }, { rows: [] }] } })
  const statements = [{ text: 'INSERT INTO a RETURNING id' }, { text: 'UPDATE b SET c = 1' }]
  assert.deepEqual(await write(db, statements), [[{ id: 1 }], []])
  assert.deepEqual(db.batches, [statements])
})
