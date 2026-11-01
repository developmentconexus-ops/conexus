import assert from 'node:assert/strict'
import { test } from 'node:test'
import { databaseFailure } from './database.ts'

/** Mastra's storage failure as `@mastra/pg` raises it, around `cause` when there is one. */
function storageFailure(message: string, cause?: unknown) {
  return Object.assign(new Error(message, { cause }), {
    domain: 'STORAGE',
    category: 'THIRD_PARTY',
  })
}

function socketFailure(code: string) {
  return Object.assign(new Error(`connect ${code} 127.0.0.1:5432`), { syscall: 'connect', code })
}

test('a falha do armazenamento do Mastra com a conexão perdida nas causas é o banco fora: o soquete recusado, cortado, e os dois prazos do pg-pool (F-B)', () => {
  for (const cause of [
    socketFailure('ECONNREFUSED'),
    socketFailure('ECONNRESET'),
    new AggregateError([socketFailure('ECONNREFUSED')], 'connect failed'),
    new Error('timeout exceeded when trying to connect'),
    new Error('Connection terminated due to connection timeout', { cause: new Error('x') }),
  ]) {
    assert.equal(
      databaseFailure(storageFailure('LIST_MESSAGES FAILED', cause)).code,
      'DATABASE_UNAVAILABLE',
    )
  }
})

test('a falha do armazenamento do Mastra sem conexão perdida é o programa: a conversa não encontrada e o JSON quebrado não dizem tente de novo (F-B)', () => {
  for (const failure of [
    storageFailure('Thread t1 not found'),
    storageFailure('Thread ID is required'),
    storageFailure('PARSE FAILED', new SyntaxError('Unexpected token } in JSON')),
  ]) {
    assert.equal(databaseFailure(failure).code, 'INTERNAL_UNEXPECTED')
  }
})
