import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NOT_FOUND } from './answers.ts'
import { sankhya } from './definition.ts'

function answer(id: string, status: number, body: unknown) {
  const found = sankhya.operations.find((candidate) => candidate.id === id)
  assert.ok(found, id)
  return found.answer({ status, body })
}

// The six pages that document the 403 body give `mensagem: { codigo, descricao }`.
const DOCUMENTED = [
  'clientes',
  'estoque',
  'contasAReceber',
  'contasAPagar',
  'precosDoProduto',
  'precosDaTabela',
]
function documented403(codigo: string | number) {
  return { fieldSet: '', paginate: '', mensagem: { codigo, descricao: 'x' } }
}

test('o 403 no corpo que as seis páginas documentam dá o mesmo que o code do gateway', () => {
  for (const id of DOCUMENTED) {
    assert.deepEqual(answer(id, 403, documented403('GTW3403')), { kind: 'TOKEN_EXPIRED' }, id)
    assert.deepEqual(answer(id, 403, documented403('4303')), { kind: 'AUTH_REFUSED' }, id)
    assert.deepEqual(answer(id, 403, documented403(4405)), { kind: 'AUTH_REFUSED' }, id)
    assert.deepEqual(
      answer(id, 403, documented403('NO_ACCESS')),
      { kind: 'REFUSED', reason: 'NO_PERMISSION' },
      id,
    )
  }
  assert.deepEqual(answer('clientes', 403, { mensagem: { descricao: 'sem código' } }), {
    kind: 'REFUSED',
    reason: 'NO_PERMISSION',
  })
})

test('o 404 que as seis páginas documentam é a leitura sem linhas; outro 404 não é', () => {
  const notFound = {
    statusCode: 404,
    error: { code: 'NOT_FOUND', message: NOT_FOUND },
  }
  // The same two keys with another message: a moved route, not an empty list.
  const framework = { statusCode: 404, error: { message: 'Cannot GET /v1/x' } }
  const keysOnly = { statusCode: 404, error: 'Not Found' }
  for (const id of DOCUMENTED) {
    assert.equal(answer(id, 404, notFound).kind, 'OK', id)
    assert.deepEqual(answer(id, 404, { message: 'nada' }), { kind: 'UNREADABLE' }, id)
    assert.deepEqual(answer(id, 404, undefined), { kind: 'UNREADABLE' }, id)
    assert.deepEqual(answer(id, 404, framework), { kind: 'UNREADABLE' }, id)
    assert.deepEqual(answer(id, 404, keysOnly), { kind: 'UNREADABLE' }, id)
  }
  assert.deepEqual(answer('clientes', 404, notFound), {
    kind: 'OK',
    value: { clientes: [], temMaisRegistros: false },
  })
  assert.deepEqual(answer('contasAPagar', 404, notFound), {
    kind: 'OK',
    value: { financeiros: [], pagination: null },
  })
  assert.deepEqual(answer('empresas', 404, notFound), { kind: 'UNREADABLE' })
})
