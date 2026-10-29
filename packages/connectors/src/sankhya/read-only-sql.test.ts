import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isOneReadStatement, isReadCondition } from './read-only-sql.ts'

describe('read-only SQL', () => {
  it('accepts one SELECT or WITH, with a closing semicolon, comments and quoted words', () => {
    for (const sql of [
      'SELECT COUNT(*) AS N FROM TSIEMP',
      'select * from TGFPAR;',
      'WITH a AS (SELECT 1 AS X FROM DUAL) SELECT X FROM a',
      "SELECT 'DELETE; DROP' AS T FROM DUAL",
      'SELECT 1E5, AD_CAMPO1, 1.5 FROM T1 WHERE A1B = 10',
    ])
      assert.equal(isOneReadStatement(sql), true, sql)
  })
})

describe('read-only SQL refusals', () => {
  it('refuses a second statement, with or without the semicolon', () => {
    for (const sql of [
      'SELECT 1; DELETE FROM TGFPAR',
      'SELECT 1 FROM DUAL;;',
      'SELECT 1 FROM DUAL; SELECT 2 FROM DUAL',
      'SELECT 1 /* x */; DELETE FROM TGFPAR',
      'SELECT 1;\n-- note\nDELETE FROM TGFPAR',
      'SELECT 1 FROM T DELETE FROM TGFPAR',
      "SELECT 1 /* /* */ ' */ DELETE FROM TGFPAR --'",
      "SELECT 1 /* /* */ ' */ ; DELETE FROM TGFPAR --'",
      "SELECT 1 /* /* /* */ */ ' */ DELETE FROM TGFPAR --'",
      "SELECT 1 /*/*/ ' */ */ DELETE FROM TGFPAR --'",
      "SELECT 1 /*/*/ ' */ DELETE FROM TGFPAR --'",
      "SELECT 1 /**/*/ ' DELETE FROM TGFPAR --'",
      'SELECT 1 /* -- */ DELETE FROM TGFPAR',
      'SELECT 1 -- /*\n DELETE FROM TGFPAR',
      'SELECT 1 /* x */DELETE FROM TGFPAR',
      'SELECT 1 /**/DELETE FROM TGFPAR',
      "SELECT N'x' DELETE FROM T",
      'SELECT [x /*] FROM T /* */ DELETE',
      'SELECT 1 DISABLE TRIGGER ALL ON TGFPAR',
      "SELECT 1 --\u000b' \n DELETE FROM TGFPAR --'",
      "SELECT 1 --\f' \n DELETE FROM TGFPAR --'",
      "SELECT 1 --\u0085' \n DELETE FROM TGFPAR --'",
      "SELECT 1 -- ' \n DELETE FROM TGFPAR --'",
      "SELECT 1 -- ' \n DELETE FROM TGFPAR --'",
    ])
      assert.equal(isOneReadStatement(sql), false, sql)
  })
})

describe('read-only SQL statement words', () => {
  it('refuses every statement word outside a quote', () => {
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
      'DISABLE',
      'ENABLE',
      'DENY',
      'REVOKE',
      'BACKUP',
      'RESTORE',
      'DBCC',
      'SHUTDOWN',
      'KILL',
      'RECONFIGURE',
      'DECLARE',
      'WAITFOR',
      'RENAME',
      'ROLLBACK',
      'RECEIVE',
      'SEND',
      'MOVE',
      'CHECKPOINT',
      'SETUSER',
      'ADD',
      'USE',
      'SET',
    ])
      assert.equal(isOneReadStatement(`SELECT 1 FROM T WHERE ${word} = 1`), false, word)
    assert.equal(isOneReadStatement('SELECT A INTO B FROM T'), false)
    assert.equal(isOneReadStatement('SELECT 1 FROM T END CONVERSATION @h'), false)
  })
})

describe('read-only SQL, comments and quotes', () => {
  it('refuses a comment anywhere, even a harmless or quoted one', () => {
    for (const sql of [
      'SELECT 1 /* ; */ FROM DUAL',
      'SELECT 1 /**/ FROM DUAL',
      "SELECT '/*' FROM DUAL",
      'SELECT [a/*b] FROM T',
      'SELECT 1 */ FROM DUAL',
      '/* note */ SELECT 1 FROM DUAL',
      'SELECT "UPDATE" FROM T -- INSERT later',
      'SELECT 1 FROM DUAL -- note',
      "SELECT 'a--b' FROM DUAL",
    ])
      assert.equal(isOneReadStatement(sql), false, sql)
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

describe('read-only criteria', () => {
  it('holds a condition to the same wire', () => {
    for (const text of [
      'this.CODEMP = ?',
      "this.NOME = 'DELETE; DROP'",
      'this.A = 1E5 AND this.AD_CAMPO1 = ?',
    ])
      assert.equal(isReadCondition(text), true, text)
    for (const text of [
      'this.A = 1; DELETE FROM TGFPAR',
      'this.A = 1 DELETE FROM TGFPAR',
      "this.A = 1 /* /* */ ' */ DELETE FROM TGFPAR --'",
      "this.A = 1 /*/*/ ' */ */ DELETE FROM TGFPAR --'",
      "this.A = 1 /* /* /* */ */ ' */ DELETE FROM TGFPAR --'",
      "this.A = 1 /*/*/ ' */ DELETE FROM TGFPAR --'",
      "this.A = 1 /**/*/ ' DELETE FROM TGFPAR --'",
      'this.A = 1 /* -- */ DELETE FROM TGFPAR',
      'this.A = 1 -- /*\n DELETE FROM TGFPAR',
      'this.A = 1 /* x */DELETE FROM TGFPAR',
      'this.A = 1 /**/DELETE FROM TGFPAR',
      'this.A = 1 /* ; */',
      'this.A = 1 /**/',
      'this.A = 1 DISABLE TRIGGER ALL ON TGFPAR',
      'this.A = 1 ENABLE TRIGGER ALL ON TGFPAR',
      "this.A = 1 --\u000b' \n DELETE FROM TGFPAR --'",
      "this.A = 1 --\f' \n DELETE FROM TGFPAR --'",
      "this.A = 1 --\u0085' \n DELETE FROM TGFPAR --'",
      "this.A = 1 -- ' \n DELETE FROM TGFPAR --'",
      "this.A = 1 -- ' \n DELETE FROM TGFPAR --'",
      'this.A = 1 -- note',
      'this.A = 1 /* open',
      'this.A = 1DELETE FROM TGFPAR',
    ])
      assert.equal(isReadCondition(text), false, text)
  })
})
