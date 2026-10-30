import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONNECTORS, connectorOf } from '../index.ts'
import { runConformance } from '../kernel/conformance.ts'
import type { Operation } from '../kernel/operation.ts'
import { requestOf } from '../kernel/operation.ts'
import { sankhya } from './definition.ts'
import { sankhyaDoor } from './door.ts'
import { sankhyaFake } from './fake.ts'

runConformance(sankhya, sankhyaFake())

const NO_ACCOUNT = { ref: null }

function operation(id: string): Operation<unknown, unknown> {
  const found = [...sankhya.operations, ...Object.values(sankhya.readDoor ?? {})].find(
    (candidate) => candidate.id === id,
  )
  assert.ok(found, id)
  return found
}
function answer(id: string, status: number, body: unknown) {
  return operation(id).answer({ status, body })
}

function envelope(responseBody: unknown, status = '1') {
  return { serviceName: 'x', status, responseBody }
}

test('o catálogo tem o Sankhya e o Mercado Livre, o Sankhya achado pelo id', () => {
  assert.deepEqual(
    CONNECTORS.map((connector) => connector.id),
    ['sankhya', 'mercado-livre'],
  )
  assert.equal(connectorOf('sankhya'), sankhya)
  assert.equal(connectorOf('Sankhya'), undefined)
  assert.equal(connectorOf('nope'), undefined)
})

const INJECTION = {
  entidade: 'Empresa',
  campos: ['CODEMP'],
  pagina: 0,
  criterio: { expressao: 'this.CODEMP = 1; DELETE FROM TSIEMP', parametros: [] },
}

const LOADING = {
  entidade: 'Empresa',
  campos: ['CODEMP', 'NOMEFANTASIA'],
  pagina: 2,
  criterio: { expressao: 'this.CODEMP = ?', parametros: [{ valor: '1', tipo: 'I' as const }] },
}

test('a porta de leitura só lê', () => {
  const { consultar, carregar } = sankhyaDoor
  for (const sql of ['SELECT 1 FROM DUAL', 'WITH a AS (SELECT 1 N FROM DUAL) SELECT N FROM a'])
    assert.equal(consultar.input.safeParse({ sql }).success, true, sql)
  for (const sql of [
    'SELECT 1; DELETE FROM TGFPAR',
    'INSERT INTO T VALUES (1)',
    'UPDATE T SET A = 1',
    'DELETE FROM T',
    'MERGE INTO T USING U ON (1=1)',
    'EXEC sp_who',
    'SELECT 1 /* a */; DELETE FROM T',
    "SELECT q'[x]' FROM DUAL",
    '',
  ])
    assert.equal(consultar.input.safeParse({ sql }).success, false, sql)

  assert.throws(() => requestOf(sankhyaDoor.consultar, { sql: 'DELETE FROM T' }, NO_ACCOUNT))
  assert.throws(() => requestOf(sankhyaDoor.carregar, INJECTION, NO_ACCOUNT))

  const loaded = carregar.request(LOADING, NO_ACCOUNT)
  assert.equal(loaded.method, 'POST')
  assert.equal(loaded.path, '/gateway/v1/mge/service.sbr')
  assert.deepEqual(loaded.query, {
    serviceName: 'CRUDServiceProvider.loadRecords',
    outputType: 'json',
  })
  assert.deepEqual(loaded.body, {
    serviceName: 'CRUDServiceProvider.loadRecords',
    requestBody: {
      dataSet: {
        rootEntity: 'Empresa',
        includePresentationFields: 'N',
        offsetPage: '2',
        criteria: { expression: { $: 'this.CODEMP = ?' }, parameter: [{ $: '1', type: 'I' }] },
        entity: { fieldset: { list: 'CODEMP,NOMEFANTASIA' } },
      },
    },
  })
  for (const bad of [
    { entidade: 'empresa' },
    { entidade: 'Empresa; X' },
    { campos: [] },
    { campos: ['a b'] },
    { pagina: -1 },
    { campos: Array(51).fill('A') },
  ])
    assert.equal(
      carregar.input.safeParse({ entidade: 'Empresa', campos: ['A'], pagina: 0, ...bad }).success,
      false,
      JSON.stringify(bad),
    )

  const services = [
    consultar.request(consultar.input.parse(consultar.probe(new Map())), NO_ACCOUNT).query
      .serviceName,
    carregar.request(carregar.input.parse(carregar.probe(new Map())), NO_ACCOUNT).query.serviceName,
  ]
  assert.deepEqual(services.sort(), [
    'CRUDServiceProvider.loadRecords',
    'DbExplorerSP.executeQuery',
  ])
  assert.deepEqual(Object.keys(sankhyaDoor).sort(), ['carregar', 'consultar'])
  assert.ok(Object.values(sankhyaDoor).every((entry) => entry.class === 'read'))
})

test('as operações prontas leem o envelope e passam as linhas como vieram', () => {
  const empresas = { empresas: [{ codigoEmpresa: 1, nomeFantasia: 'A', extra: { x: 1 } }] }
  assert.deepEqual(answer('empresas', 200, empresas), {
    kind: 'OK',
    value: { linhas: empresas.empresas, temMais: null },
  })
  assert.partialDeepStrictEqual(answer('empresas', 200, { empresas: ['A'] }), {
    kind: 'UNREADABLE',
  })
  assert.partialDeepStrictEqual(answer('empresas', 200, 'text'), { kind: 'UNREADABLE' })
  assert.partialDeepStrictEqual(answer('empresas', 404, { message: 'nada' }), {
    kind: 'REFUSED',
  })
  assert.partialDeepStrictEqual(answer('empresas', 400, { code: 'X', message: 'm', details: [] }), {
    kind: 'REFUSED',
  })
  // The logged-out token's answer, measured 2026-10-30: renewed once, never "connect again".
  assert.partialDeepStrictEqual(answer('empresas', 401, { code: 'UNAUTHORIZED' }), {
    kind: 'TOKEN_EXPIRED',
  })
  assert.partialDeepStrictEqual(answer('empresas', 403, { code: '4303' }), { kind: 'AUTH_REFUSED' })
  assert.partialDeepStrictEqual(answer('empresas', 403, { code: 4405 }), { kind: 'AUTH_REFUSED' })
  assert.partialDeepStrictEqual(answer('empresas', 403, { code: 'GTW3403' }), {
    kind: 'TOKEN_EXPIRED',
  })
  assert.partialDeepStrictEqual(
    answer('empresas', 403, { message: 'GTW3403 - Bearer Token inválido ou Expirado' }),
    { kind: 'TOKEN_EXPIRED' },
  )
  assert.partialDeepStrictEqual(answer('empresas', 403, { code: 'NO_ACCESS' }), {
    kind: 'REFUSED',
  })
  assert.partialDeepStrictEqual(answer('empresas', 403, undefined), {
    kind: 'REFUSED',
  })
  assert.partialDeepStrictEqual(answer('empresas', 409, undefined), { kind: 'REFUSED' })
  assert.partialDeepStrictEqual(answer('empresas', 503, undefined), { kind: 'UNREADABLE' })
})

test('os probes encadeiam o código como veio, número ou texto', () => {
  const nota = operation('notaFiscal')
  const fromText = new Map([
    [operation('notasFiscais').id, { linhas: [{ codigoNota: '201' }], temMais: null }],
  ])
  assert.deepEqual(nota.probe(fromText), { codigoNota: 201 })
  const fromNothing = new Map([
    [operation('notasFiscais').id, { linhas: [{ codigoNota: null }], temMais: null }],
  ])
  assert.equal(nota.probe(fromNothing), null)
  const pedidos = operation('pedidos')
  const empresas = new Map([
    [operation('empresas').id, { linhas: [{ codigoEmpresa: 3 }], temMais: false }],
  ])
  assert.deepEqual(pedidos.probe(empresas), { codigoEmpresa: 3, page: 0 })
  assert.deepEqual(operation('contasAReceber').probe(empresas), { codigoEmpresa: 3, page: 1 })
})

test('a porta lê o envelope: sucesso, recusa do fornecedor e o que não se lê', () => {
  const one = envelope({
    entities: {
      total: '1',
      hasMoreResult: 'false',
      metadata: { fields: { field: [{ name: 'CODEMP' }, { name: 'X' }] } },
      entity: { f0: { $: '10' } },
    },
  })
  assert.deepEqual(answer('carregar', 200, one), {
    kind: 'OK',
    value: { linhas: [{ CODEMP: '10', X: null }], temMais: false },
  })
  const many = envelope({
    entities: {
      hasMoreResult: true,
      metadata: { fields: { field: { name: 'A' } } },
      entity: [{ f0: { $: 1 } }, { f0: {} }],
    },
  })
  assert.deepEqual(answer('carregar', 200, many), {
    kind: 'OK',
    value: { linhas: [{ A: '1' }, { A: null }], temMais: true },
  })
  assert.deepEqual(
    answer('carregar', 200, envelope({ entities: { total: '0', hasMoreResult: 'false' } })),
    { kind: 'OK', value: { linhas: [], temMais: false } },
  )
  const rows = envelope({
    fieldsMetadata: [{ name: 'N' }, { name: 'M' }],
    rows: [[2, 'a'], [3]],
    burstLimit: true,
  })
  assert.deepEqual(answer('consultar', 200, rows), {
    kind: 'OK',
    value: {
      linhas: [
        { N: 2, M: 'a' },
        { N: 3, M: null },
      ],
      completo: false,
    },
  })

  for (const status of ['0', '2', 'x'])
    assert.partialDeepStrictEqual(
      answer('carregar', 200, envelope({}, status)),
      { kind: 'REFUSED' },
      status,
    )
  // Two calls open on one token: our fault (#470), unreadable with what came, never the vendor's refusal.
  const four = { status: '4', statusMessage: 'Requisição cancelada' }
  assert.deepEqual(answer('consultar', 200, four), {
    kind: 'UNREADABLE',
    native: { status: 200, code: '4', message: 'Requisição cancelada', body: four },
  })
  assert.partialDeepStrictEqual(answer('carregar', 401, undefined), { kind: 'TOKEN_EXPIRED' })
  assert.partialDeepStrictEqual(
    answer('consultar', 200, {
      status: '1',
      statusMessage: '[CORE_E01234] regra',
      responseBody: { fieldsMetadata: [], rows: [] },
    }),
    { kind: 'REFUSED' },
  )
  assert.partialDeepStrictEqual(
    answer('consultar', 200, { status: '1', responseBody: { rows: 'x' } }),
    { kind: 'UNREADABLE' },
  )
  assert.partialDeepStrictEqual(answer('carregar', 200, { responseBody: {} }), {
    kind: 'UNREADABLE',
  })
  assert.partialDeepStrictEqual(answer('carregar', 403, { code: 'GTW3403' }), {
    kind: 'TOKEN_EXPIRED',
  })
  assert.partialDeepStrictEqual(answer('carregar', 403, undefined), {
    kind: 'REFUSED',
  })
  assert.partialDeepStrictEqual(answer('carregar', 400, undefined), { kind: 'REFUSED' })
})

test('a recusa do envelope leva o que o Sankhya disse; uma linha lida e um 2xx ilegível não', () => {
  // A row the company wrote may hold the vendor's marker; only the envelope's message refuses.
  assert.deepEqual(
    answer('consultar', 200, {
      status: '1',
      responseBody: { fieldsMetadata: [{ name: 'OBS' }], rows: [['[CORE_E123] texto gravado']] },
    }),
    { kind: 'OK', value: { linhas: [{ OBS: '[CORE_E123] texto gravado' }], completo: true } },
  )
  const rule = answer('consultar', 200, {
    status: '1',
    statusMessage: '[CORE_E01234] regra',
    responseBody: { rows: [['dado da empresa']] },
  })
  assert.partialDeepStrictEqual(rule, {
    kind: 'REFUSED',
    native: { status: 200, code: 'CORE_E01234', message: '[CORE_E01234] regra' },
  })
  assert.partialDeepStrictEqual(answer('consultar', 200, envelope({}, '0')), {
    kind: 'REFUSED',
    native: { code: '0' },
  })
  // A 2xx the kit cannot read never carries the company's data body.
  assert.partialDeepStrictEqual(
    answer('consultar', 200, { status: '1', responseBody: { rows: 'x' } }),
    { kind: 'UNREADABLE', native: { status: 200, body: null } },
  )
})
