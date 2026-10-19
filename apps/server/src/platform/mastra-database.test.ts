import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DatabaseUrl } from './database.ts'
import { createTestDatabase, loginAnswer } from './test-database.ts'

function inDatabase(url: DatabaseUrl, of: DatabaseUrl): DatabaseUrl {
  const next = new URL(url.reveal())
  next.pathname = new URL(of.reveal()).pathname
  return DatabaseUrl.parse(next.toString())
}

test('teste 1: o login do Mastra tenta entrar no banco do Hub e ler uma tabela, e o banco recusa', async (t) => {
  const { mastraUrl, runtimeUrl } = await createTestDatabase(t)
  const intoHub = inDatabase(mastraUrl, runtimeUrl)
  assert.equal(await loginAnswer(intoHub), '42501')
  assert.equal(await loginAnswer(intoHub, 'select count(*) from builder.model_account'), '42501')
  assert.equal(await loginAnswer(mastraUrl), 'ok')
})

test('o login do Mastra cria as suas tabelas no banco dele; o do Hub não entra nele', async (t) => {
  const { mastraUrl, runtimeUrl } = await createTestDatabase(t)
  const created =
    'create schema planted; create table planted.thread (id int); drop schema planted cascade'
  assert.equal(await loginAnswer(mastraUrl, created), 'ok')
  assert.equal(await loginAnswer(inDatabase(runtimeUrl, mastraUrl)), '42501')
})
