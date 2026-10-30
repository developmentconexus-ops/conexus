import assert from 'node:assert/strict'
import { test } from 'node:test'
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

function measured(details: string, code = 'RESOURCE_NOT_FOUND') {
  return {
    statusCode: 404,
    error: { code, message: 'Recurso solicitado não foi encontrado!', details },
  }
}

test('o 404 que o Sankhya manda para uma página sem linhas lê sem linhas em toda leitura; outro 404 não', () => {
  const empty = measured('Nenhum registro da entidade CabecalhoNota com o identificador informado!')
  for (const { id } of sankhya.operations) {
    assert.deepEqual(
      answer(id, 404, empty),
      { kind: 'OK', value: { linhas: [], temMais: false } },
      id,
    )
    assert.partialDeepStrictEqual(
      answer(id, 404, measured('A rota mudou')),
      { kind: 'REFUSED' },
      id,
    )
    assert.partialDeepStrictEqual(
      answer(id, 404, measured(empty.error.details, 'OUTRO')),
      { kind: 'REFUSED' },
      id,
    )
    // What the pages document for a 404 was never what the gateway sent: it stays a refusal.
    assert.partialDeepStrictEqual(
      answer(id, 404, { statusCode: 404, error: { message: 'Dados não encontrados' } }),
      { kind: 'REFUSED' },
      id,
    )
    assert.partialDeepStrictEqual(answer(id, 404, undefined), { kind: 'REFUSED' }, id)
    // The 200 shape of the list with a 404 status is not a list.
    assert.partialDeepStrictEqual(answer(id, 404, { empresas: [] }), { kind: 'REFUSED' }, id)
  }
})

test('as linhas passam como vieram; o objeto único é uma lista de um; a página diz se há outra', () => {
  const vendedores = {
    vendedores: [
      { codigoVendedor: 7, tipo: 1 },
      { codigoVendedor: 8, tipo: 'G' },
    ],
  }
  assert.deepEqual(answer('vendedores', 200, vendedores), {
    kind: 'OK',
    value: { linhas: vendedores.vendedores, temMais: null },
  })
  const one = { codigoOrdemCarga: 55, 'campo:': 'x' }
  assert.deepEqual(
    answer('ordensCarga', 200, { ordensCarga: one, pagination: { hasMore: 'true' } }),
    { kind: 'OK', value: { linhas: [one], temMais: true } },
  )
  assert.deepEqual(
    answer('contasAPagar', 200, { financeiros: [], pagination: { page: 1, hasMore: false } }),
    { kind: 'OK', value: { linhas: [], temMais: false } },
  )
  assert.deepEqual(
    answer('precosDoProduto', 200, { produtos: [{ codigoTabela: 1 }], temMaisRegistros: true }),
    { kind: 'OK', value: { linhas: [{ codigoTabela: 1 }], temMais: true } },
  )
})

test('um 2xx que não encaixa diz onde e que tipo veio, nunca um valor nem a frase de sucesso', () => {
  const body = { mensagem: 'Consulta realizada com sucesso!', data: { codigo: 'VALOR' } }
  assert.deepEqual(answer('naturezas', 200, { ...body, data: 'VALOR' }), {
    kind: 'UNREADABLE',
    native: {
      status: 200,
      code: null,
      message: null,
      body: null,
      reason: { kind: 'SHAPE', issues: [{ path: 'data', expected: 'array', received: 'string' }] },
    },
  })
  assert.deepEqual(answer('pedidos', 200, { registros: [] }), {
    kind: 'UNREADABLE',
    native: {
      status: 200,
      code: null,
      message: null,
      body: null,
      reason: {
        kind: 'SHAPE',
        issues: [{ path: 'pedido', expected: 'array', received: 'undefined' }],
      },
    },
  })
  const paging = answer('empresas', 200, { empresas: [], pagination: { hasMore: 'talvez' } })
  assert.partialDeepStrictEqual(paging, {
    kind: 'UNREADABLE',
    native: {
      reason: { kind: 'SHAPE', issues: [{ path: 'pagination.hasMore', received: 'string' }] },
    },
  })
  assert.ok(!JSON.stringify(paging).includes('talvez'))
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
