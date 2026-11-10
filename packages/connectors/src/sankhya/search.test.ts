import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { readToken, tokenRequest } from '../kernel/auth.ts'
import { SENT_AT } from '../kernel/conformance-declared.ts'
import type { Operation } from '../kernel/operation.ts'
import { requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { sankhya } from './definition.ts'
import { queryRequest } from './door.ts'
import { sankhyaFake } from './fake.ts'
import { buscarParceiros, buscarProdutos, buscarVendedores } from './operations/buscas.ts'
import { estoqueDosProdutos } from './operations/buscas-estoque.ts'
import { isOneReadStatement } from './read-only-sql.ts'

/** The double without a socket, signed in once: `read` sends an operation's input and gives what the kit reads from the answer. */
async function withDouble(
  use: (
    read: <I, O>(
      operation: Operation<I, O>,
      input: unknown,
    ) => Promise<ReturnType<typeof answerOf<O>>>,
    fake: ReturnType<typeof sankhyaFake>,
  ) => Promise<void>,
) {
  const fake = sankhyaFake()
  const login = await fake.handle(
    toRequest(sankhya, tokenRequest(sankhya.auth, fake.credential), null),
  )
  const token = readToken(sankhya.auth, { status: login.status, body: await login.json() })
  assert.equal(token.kind, 'OK')
  if (token.kind !== 'OK') return
  await use(async (operation, input) => {
    const request = requestOf(operation, input, { ref: null }, SENT_AT)
    const response = await fake.handle(toRequest(sankhya, request, token.accessToken))
    return answerOf(operation, response.status, z.unknown().parse(await response.json()))
  }, fake)
}

function answerOf<O>(operation: Operation<unknown, O>, status: number, body: unknown) {
  return operation.answer({ status, body })
}

/** The rows of an OK answer, or the failure it was. */
function rowsOf(answered: { kind: string; value?: unknown }) {
  assert.equal(answered.kind, 'OK', JSON.stringify(answered))
  return z
    .object({ linhas: z.array(z.record(z.string(), z.unknown())), temMais: z.boolean() })
    .parse(answered.value)
}

function codes(answered: { kind: string; value?: unknown }, field: string) {
  return rowsOf(answered).linhas.map((row) => row[field])
}

const TOTAL_PARCEIROS = 4 + 7 + 45

test('parceiro por parte do nome: com ou sem acento, em qualquer caixa, em nome ou razão social', async () => {
  await withDouble(async (read) => {
    for (const nome of ['sao', 'SÃO', 'São', 'sÃo']) {
      assert.deepEqual(
        codes(await read(buscarParceiros, { nome }), 'codigoParceiro'),
        [200, 201],
        nome,
      )
    }
    assert.deepEqual(codes(await read(buscarParceiros, { nome: 'joao' }), 'codigoParceiro'), [206])
    // The legal name is searched too: "comercio" is only in the legal name of 206, kept in mixed case with a lower-case accent.
    assert.deepEqual(
      codes(await read(buscarParceiros, { nome: 'comercio' }), 'codigoParceiro'),
      [205, 206],
    )
  })
})

test('o nome com aspa, %, _ ou barra procura esse texto e nunca vira curinga nem SQL', async () => {
  await withDouble(async (read) => {
    assert.deepEqual(
      codes(await read(buscarParceiros, { nome: "d'agua" }), 'codigoParceiro'),
      [203],
    )
    assert.deepEqual(codes(await read(buscarParceiros, { nome: '100%' }), 'codigoParceiro'), [204])
    assert.deepEqual(
      codes(await read(buscarParceiros, { nome: 'loja_um' }), 'codigoParceiro'),
      [205],
    )
    // Unescaped, `__` would stand for any two letters and `%%` for everything.
    for (const nome of ['__', '%%', '\\\\', "x' OR '1'='1", "''"]) {
      assert.deepEqual(rowsOf(await read(buscarParceiros, { nome })).linhas, [], nome)
    }
  })
})

test('um texto hostil ou fora de faixa é recusado antes de qualquer chamada, e o SQL que sai passa no filtro de leitura', async () => {
  for (const nome of [
    '--',
    'a--b',
    'a/*b',
    'a*/b',
    'a;b',
    'a\nb',
    'a\tb',
    'a\u0000b',
    'a\u2028b',
    'a\u2029b',
    'x',
    'y'.repeat(61),
    ' ',
    '  x  ',
  ]) {
    assert.equal(buscarParceiros.input.safeParse({ nome }).success, false, JSON.stringify(nome))
  }
  for (const bad of [
    { documento: '1234567890' },
    { documento: '123456789012' },
    { documento: '12.345.678/0001-90' },
    { limite: 0 },
    { limite: 101 },
    { codigos: [] },
    { codigos: Array.from({ length: 101 }, (_, at) => at) },
    { codigos: [-1] },
    { codigos: [1.5] },
    { depoisDe: -1 },
    { papel: 'vendedor' },
    { telefone: '1' },
  ]) {
    assert.equal(buscarParceiros.input.safeParse(bad).success, false, JSON.stringify(bad))
  }
  assert.equal(
    buscarProdutos.input.safeParse({ grupos: Array.from({ length: 51 }, (_, at) => at) }).success,
    false,
  )
  assert.equal(estoqueDosProdutos.input.safeParse({}).success, false)
  assert.equal(
    estoqueDosProdutos.input.safeParse({ codigos: Array.from({ length: 51 }, (_, at) => at) })
      .success,
    false,
  )
  const hostile = [
    "D'AGUA",
    "x' OR '1'='1",
    'drop table',
    'delete from x',
    'insert',
    'qq',
    "faq'",
    '100%',
    'a_b',
    'a\\b',
  ]
  for (const nome of hostile) {
    for (const operation of [buscarParceiros, buscarProdutos, buscarVendedores]) {
      const { body } = requestOf(operation, { nome }, { ref: null }, SENT_AT)
      const { requestBody } = z.object({ requestBody: z.object({ sql: z.string() }) }).parse(body)
      assert.equal(isOneReadStatement(requestBody.sql), true, `${operation.id} ${nome}`)
    }
  }
  // The searches build their SQL through `queryRequest`, which judges it again.
  assert.throws(() => queryRequest('DELETE FROM TGFPAR'), z.ZodError)
})

test('a busca de parceiros combina os filtros com E: documento, papel, ativo, códigos e faixa', async () => {
  await withDouble(async (read) => {
    async function ids(input: object) {
      return codes(await read(buscarParceiros, input), 'codigoParceiro')
    }
    assert.deepEqual(await ids({ documento: '99999999000303' }), [203])
    assert.deepEqual(await ids({ papel: 'fornecedor' }), [201, 203, 204])
    assert.deepEqual(await ids({ papel: 'fornecedor', nome: 'sao' }), [201])
    assert.deepEqual(await ids({ ativo: false }), [205])
    assert.deepEqual(await ids({ codigos: [206, 100, 999] }), [100, 206])
    assert.deepEqual(await ids({ deCodigo: 101, ateCodigo: 103 }), [101, 102, 103])
    assert.deepEqual(await ids({ deCodigo: 300, ateCodigo: 301, ativo: true }), [300, 301])
    const [first] = rowsOf(await read(buscarParceiros, { documento: '99999999000303' })).linhas
    assert.deepEqual(first, {
      codigoParceiro: 203,
      nome: "D'AGUA CLARA DISTRIBUIDORA",
      razaoSocial: "D'AGUA CLARA DISTRIBUIDORA",
      documento: '99999999000303',
      tipoPessoa: 'J',
      ativo: true,
      cliente: true,
      fornecedor: true,
    })
  })
})

test('paginar com depoisDe percorre todos os parceiros em ordem, sem perder nem repetir, e temMais é exato', async () => {
  await withDouble(async (read) => {
    const seen: unknown[] = []
    let after: number | undefined
    let pages = 0
    for (;;) {
      const page = rowsOf(
        await read(buscarParceiros, after === undefined ? {} : { depoisDe: after }),
      )
      assert.ok(page.linhas.length <= 20, 'the default is the 20 rows the model reads')
      seen.push(...page.linhas.map((row) => row.codigoParceiro))
      pages += 1
      if (!page.temMais) break
      after = z.number().parse(seen.at(-1))
    }
    assert.equal(seen.length, TOTAL_PARCEIROS)
    assert.equal(new Set(seen).size, TOTAL_PARCEIROS)
    assert.deepEqual(
      seen,
      seen.toSorted((a, b) => z.number().parse(a) - z.number().parse(b)),
    )
    assert.equal(pages, 3)
    const exact = rowsOf(await read(buscarParceiros, { limite: TOTAL_PARCEIROS }))
    assert.deepEqual([exact.linhas.length, exact.temMais], [TOTAL_PARCEIROS, false])
    const short = rowsOf(await read(buscarParceiros, { limite: TOTAL_PARCEIROS - 1 }))
    assert.deepEqual([short.linhas.length, short.temMais], [TOTAL_PARCEIROS - 1, true])
  })
})

test('produtos por nome, referência, lista, faixa e grupo, com o grupo e a unidade', async () => {
  await withDouble(async (read) => {
    async function ids(input: object) {
      return codes(await read(buscarProdutos, input), 'codigoProduto')
    }
    assert.deepEqual(await ids({ nome: 'pao' }), [10, 12, 200])
    assert.deepEqual(await ids({ nome: 'ACUCAR' }), [201])
    assert.deepEqual(await ids({ referencia: 'cf-' }), [202])
    const ten = [409, 400, 401, 402, 403, 404, 405, 406, 407, 408]
    assert.deepEqual(await ids({ codigos: ten }), ten.toSorted((a, b) => a - b))
    assert.deepEqual(await ids({ deCodigo: 400, ateCodigo: 409 }), ten.toSorted((a, b) => a - b))
    assert.deepEqual(await ids({ grupos: [3] }), [203])
    assert.deepEqual(await ids({ grupos: [1, 3], ativo: true }), [200])
    const [row] = rowsOf(await read(buscarProdutos, { codigos: [202] })).linhas
    assert.deepEqual(row, {
      codigoProduto: 202,
      nome: 'CAFÉ TORRADO 500G',
      referencia: 'CF-500',
      codigoGrupo: 2,
      grupo: 'MERCEARIA',
      unidade: 'UN',
      marca: 'MARCA TESTE',
      ativo: true,
    })
    const page = rowsOf(await read(buscarProdutos, { depoisDe: 203, limite: 5 }))
    assert.deepEqual(
      page.linhas.map((each) => each.codigoProduto),
      [400, 401, 402, 403, 404],
    )
    assert.equal(page.temMais, true)
  })
})

test('vendedores por apelido, lista e ativo', async () => {
  await withDouble(async (read) => {
    async function ids(input: object) {
      return codes(await read(buscarVendedores, input), 'codigoVendedor')
    }
    assert.deepEqual(await ids({ nome: 'ze' }), [20])
    assert.deepEqual(await ids({ nome: 'lucia' }), [21])
    assert.deepEqual(await ids({ ativo: false }), [22])
    assert.deepEqual(await ids({ codigos: [2, 3, 99] }), [2, 3])
    assert.deepEqual(await ids({ depoisDe: 5, limite: 2 }), [20, 21])
  })
})

test('o estoque de vários produtos numa chamada: o saldo, o reservado e o disponível por empresa e local', async () => {
  await withDouble(async (read) => {
    // Ten products, five with stock: a product with no line in TGFEST brings no line.
    const lines = rowsOf(
      await read(estoqueDosProdutos, { codigos: [400, 201, 11, 200, 10, 12, 13, 202, 203, 401] }),
    ).linhas
    assert.deepEqual(
      lines.map((each) => [each.codigoProduto, each.codigoEmpresa, each.codigoLocal]),
      [
        [10, 1, 1],
        [10, 1, 2],
        [11, 1, 1],
        [11, 2, 1],
        [12, 1, 1],
        [12, 1, 1],
        [200, 1, 1],
        [201, 1, 1],
      ],
    )
    assert.deepEqual(lines[2], {
      codigoProduto: 11,
      codigoEmpresa: 1,
      codigoLocal: 1,
      controle: 'L1',
      tipo: 'P',
      codigoParceiro: 0,
      estoque: 12.5,
      reservado: 2.5,
      disponivel: 10,
    })
    const only = rowsOf(
      await read(estoqueDosProdutos, { codigos: [10, 11], codigoEmpresa: 2 }),
    ).linhas
    assert.deepEqual(
      only.map((each) => each.codigoProduto),
      [11],
    )
    const place = rowsOf(await read(estoqueDosProdutos, { codigos: [10], codigoLocal: 2 })).linhas
    assert.deepEqual(
      place.map((each) => each.codigoLocal),
      [2],
    )
    const third = rowsOf(await read(estoqueDosProdutos, { codigos: [12] })).linhas
    assert.deepEqual(
      third.map((each) => [each.tipo, each.codigoParceiro]),
      [
        ['P', 0],
        ['T', 201],
      ],
    )
  })
})

test('uma busca sem resposta é OK vazio, e a consulta recusada pelo Sankhya é recusa, nunca lista vazia', async () => {
  await withDouble(async (read, fake) => {
    assert.partialDeepStrictEqual(await read(buscarParceiros, { nome: 'zzzz' }), {
      kind: 'OK',
      empty: true,
      value: { linhas: [], temMais: false },
    })
    fake.switches.refuse.add('consultar')
    assert.equal((await read(buscarParceiros, {})).kind, 'REFUSED')
    assert.equal((await read(estoqueDosProdutos, { codigos: [10] })).kind, 'REFUSED')
  })
})
