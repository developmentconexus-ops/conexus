import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isOneReadStatement } from './read-only-sql.ts'

describe('read-only SQL', () => {
  it('accepts one SELECT or WITH, with a closing semicolon, comments and quoted words', () => {
    for (const sql of [
      'SELECT COUNT(*) AS N FROM TSIEMP',
      'select * from TGFPAR;',
      'WITH a AS (SELECT 1 AS X FROM DUAL) SELECT X FROM a',
      "SELECT 'DELETE; DROP' AS T FROM DUAL",
      'SELECT "UPDATE" FROM T -- INSERT later',
      'SELECT 1 /* ; */ FROM DUAL',
    ])
      assert.equal(isOneReadStatement(sql), true, sql)
  })

  it('refuses a second statement, with or without the semicolon', () => {
    for (const sql of [
      'SELECT 1; DELETE FROM TGFPAR',
      'SELECT 1 FROM DUAL;;',
      'SELECT 1 FROM DUAL; SELECT 2 FROM DUAL',
      'SELECT 1 /* x */; DELETE FROM TGFPAR',
      'SELECT 1;\n-- note\nDELETE FROM TGFPAR',
      'SELECT 1 FROM T DELETE FROM TGFPAR',
    ])
      assert.equal(isOneReadStatement(sql), false, sql)
  })

  it('refuses every statement word outside a quote or a comment', () => {
    for (const word of [
      'INSERT',
      'UPDATE',
      'DELETE',
      'MERGE',
      'EXEC',
      'EXECUTE',
      'DROP',
      'TRUNCATE',
      'GRANT',
    ])
      assert.equal(isOneReadStatement(`SELECT 1 FROM T WHERE ${word} = 1`), false, word)
    assert.equal(isOneReadStatement('SELECT A INTO B FROM T'), false)
  })

  it('refuses a text that is not a SELECT or WITH', () => {
    for (const sql of [
      '',
      '   ',
      'INSERT INTO T VALUES (1)',
      'UPDATE T SET A = 1',
      'EXEC sp_who',
      '-- SELECT\nDELETE FROM T',
    ])
      assert.equal(isOneReadStatement(sql), false, sql)
  })

  it('refuses a comment or quote that never closes, and the Oracle q-quote', () => {
    for (const sql of [
      'SELECT 1 /* open',
      "SELECT 'open",
      'SELECT [open',
      "SELECT q'[x]' FROM DUAL",
      "SELECT Q'#DELETE; DROP#' FROM DUAL",
    ])
      assert.equal(isOneReadStatement(sql), false, sql)
  })

  it('reads a doubled quote as an escape, not a close', () => {
    assert.equal(isOneReadStatement("SELECT 'it''s; DELETE' FROM DUAL"), true)
    assert.equal(isOneReadStatement("SELECT 'a''; DELETE FROM T -- "), false)
  })
})
