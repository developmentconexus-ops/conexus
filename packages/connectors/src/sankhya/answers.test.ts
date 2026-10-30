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
    assert.partialDeepStrictEqual(
      answer(id, 403, documented403('GTW3403')),
      { kind: 'TOKEN_EXPIRED' },
      id,
    )
    assert.partialDeepStrictEqual(
      answer(id, 403, documented403('4303')),
      { kind: 'AUTH_REFUSED' },
      id,
    )
    assert.partialDeepStrictEqual(
      answer(id, 403, documented403(4405)),
      { kind: 'AUTH_REFUSED' },
      id,
    )
    assert.partialDeepStrictEqual(
      answer(id, 403, documented403('NO_ACCESS')),
      { kind: 'REFUSED' },
      id,
    )
  }
  assert.partialDeepStrictEqual(
    answer('clientes', 403, { mensagem: { descricao: 'sem código' } }),
    {
      kind: 'REFUSED',
    },
  )
})

test('o 404 no formato que o kit espera é a leitura sem linhas; outro 404 não é', () => {
  const notFound = {
    statusCode: 404,
    error: { code: 'NOT_FOUND', message: NOT_FOUND },
  }
  // The same two keys with another message: a moved route, not an empty list.
  const framework = { statusCode: 404, error: { message: 'Cannot GET /v1/x' } }
  const keysOnly = { statusCode: 404, error: 'Not Found' }
  for (const id of DOCUMENTED) {
    assert.equal(answer(id, 404, notFound).kind, 'OK', id)
    assert.partialDeepStrictEqual(answer(id, 404, { message: 'nada' }), { kind: 'REFUSED' }, id)
    assert.partialDeepStrictEqual(answer(id, 404, undefined), { kind: 'REFUSED' }, id)
    assert.partialDeepStrictEqual(answer(id, 404, framework), { kind: 'REFUSED' }, id)
    assert.partialDeepStrictEqual(answer(id, 404, keysOnly), { kind: 'REFUSED' }, id)
  }
  assert.deepEqual(answer('clientes', 404, notFound), {
    kind: 'OK',
    value: { clientes: [], temMaisRegistros: false },
  })
  assert.deepEqual(answer('contasAPagar', 404, notFound), {
    kind: 'OK',
    value: { financeiros: [], pagination: null },
  })
  assert.partialDeepStrictEqual(answer('empresas', 404, notFound), { kind: 'REFUSED' })
})

test('o 404 que o Sankhya manda de verdade para a lista vazia lê sem linhas; outro RESOURCE_NOT_FOUND não', () => {
  function measured(details: string) {
    return {
      statusCode: 404,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Recurso solicitado não foi encontrado!',
        details,
      },
    }
  }
  const empty = measured('Nenhum registro da entidade CabecalhoNota com o identificador informado!')
  const lists = [
    ...DOCUMENTED,
    'centrosResultado',
    'pedidos',
    'notasFiscais',
    'devolucoes',
    'notasCanceladas',
    'ordensCarga',
  ]
  for (const id of lists) {
    assert.equal(answer(id, 404, empty).kind, 'OK', id)
    assert.partialDeepStrictEqual(
      answer(id, 404, measured('A rota mudou')),
      { kind: 'REFUSED' },
      id,
    )
    assert.partialDeepStrictEqual(
      answer(id, 404, { statusCode: 404, error: { code: 'OUTRO', details: empty.error.details } }),
      { kind: 'REFUSED' },
      id,
    )
  }
  assert.deepEqual(answer('centrosResultado', 404, empty), {
    kind: 'OK',
    value: { centrosResultado: [] },
  })
})

test('um 2xx que não encaixa diz só o status: nem a frase de sucesso do Sankhya nem um valor', () => {
  const body = {
    mensagem: 'Consulta realizada com sucesso!',
    empresas: [{ codigoEmpresa: 'VALOR' }],
  }
  assert.deepEqual(answer('empresas', 200, body), {
    kind: 'UNREADABLE',
    native: { status: 200, code: null, message: null, body: null },
  })
})

test('a recusa leva o que o Sankhya disse, o corpo como veio', () => {
  const body = { mensagem: { codigo: 'NO_ACCESS', descricao: 'sem acesso' }, extra: [1] }
  assert.deepEqual(answer('clientes', 403, body), {
    kind: 'REFUSED',
    native: { status: 403, code: 'NO_ACCESS', message: 'sem acesso', body },
  })
  assert.deepEqual(answer('clientes', 503, 'fora do ar'), {
    kind: 'UNREADABLE',
    native: { status: 503, code: null, message: null, body: 'fora do ar' },
  })
})
