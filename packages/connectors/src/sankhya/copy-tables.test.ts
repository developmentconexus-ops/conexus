import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import type { TableColumn, TableDeclaration, TablePosition } from '../index.ts'
import {
  discoverTables,
  lakeNameOf,
  readTablePage,
  sankhyaFake,
  startDateLimits,
  tableCeiling,
  tableMonths,
  treatedSelect,
} from '../index.ts'
import { sendTo, tableReachOf, walkTable } from '../kernel/conformance-tables.ts'
import { defineConnector } from '../kernel/definition.ts'
import { sankhya } from './definition.ts'
import {
  LARGE_XML_BYTES,
  OUTSIDE_DICTIONARY,
  UNKNOWN_TYPE_COLUMN,
  WIDE_COLUMNS,
  WINDOW_MONTHS,
} from './fake-tables.ts'

function tableOf(name: string): TableDeclaration {
  return sankhya.tables?.declared.find((table) => table.name === name) ?? assert.fail(name)
}

async function columnsOf(name: string): Promise<readonly TableColumn[]> {
  const found = await discoverTables(await tableReachOf(sankhya, sankhyaFake()))
  return found.find(({ declaration }) => declaration.name === name)?.columns ?? assert.fail(name)
}

test('o Sankhya declara as tabelas que as sondas fecharam, e o dicionário dá a descrição e as colunas', async () => {
  const declared = sankhya.tables?.declared ?? []
  assert.equal(declared.length, 49)
  assert.partialDeepStrictEqual(tableOf('notas'), {
    label: 'Notas e pedidos',
    description:
      'Cabeçalho de toda nota e pedido do Sankhya: venda, compra, devolução e transferência. O tipo de cada uma vem em TIPMOV.',
    group: 'vendas',
    source: { kind: 'TABLE', table: 'TGFCAB' },
    key: ['NUNOTA'],
    mode: { kind: 'CHANGED', column: 'DTALTER', registry: false },
  })
  assert.partialDeepStrictEqual(tableOf('efd_st_media_diaria'), {
    mode: { kind: 'WINDOW', column: 'DTREF', step: 'MONTH' },
  })
  assert.partialDeepStrictEqual(tableOf('notas_nfe'), {
    source: { kind: 'TABLE', table: 'TGFNFE' },
    mode: { kind: 'FULL' },
    history: false,
    meanings: { XML: 'NFE_XML' },
  })
  const measured = Object.fromEntries(
    declared.map(({ source, key, mode }) => [
      source.kind === 'TABLE' ? source.table : '',
      { key, mode },
    ]),
  )
  assert.partialDeepStrictEqual(measured, {
    TGFCUS: {
      key: ['CODPROD', 'CODEMP', 'DTATUAL', 'CODLOCAL', 'CONTROLE', 'NUNOTA', 'SEQUENCIA'],
      mode: { kind: 'CHANGED', column: 'DHALTER', registry: true },
    },
    TGFICM: { mode: { kind: 'FULL' } },
    TGFIPI: { key: ['CODIPI'], mode: { kind: 'FULL' } },
    TGFCFO: { key: ['CODCFO'], mode: { kind: 'FULL' } },
    TGFAJA: { key: ['NUAJA'], mode: { kind: 'CHANGED', column: 'DTALTER', registry: true } },
    TGFCTS: { mode: { kind: 'FULL' } },
    TCBSALEMP: {
      key: ['CODEMP', 'CODCTACTB', 'CODCENCUS', 'CODPROJ', 'REFERENCIA', 'CODEMPDEST'],
      mode: { kind: 'FULL' },
    },
  })
  const found = await discoverTables(await tableReachOf(sankhya, sankhyaFake()))
  const nfe = found.find(({ declaration }) => declaration.name === 'notas_nfe')
  assert.deepEqual(
    nfe?.columns?.find(({ name }) => name === 'XML'),
    { name: 'XML', type: 'text', description: 'Campo xml' },
  )
  assert.equal(
    found.find(({ declaration }) => declaration.name === 'financeiro')?.columns,
    null,
    'uma tabela que o dicionário não tem volta ausente, nunca inventada',
  )
})

test('o tipo da coluna: CLOB é texto, BLOB é binário em base64, e um tipo que o mapa não conhece vem como texto com o tipo na descrição', async () => {
  const produtos = tableOf('produtos')
  assert.deepEqual(produtos.columns, { kind: 'DISCOVERED', exclude: ['IMAGEM'] })
  const fake = sankhyaFake()
  const reach = await tableReachOf(sankhya, fake)
  const whole: TableDeclaration = { ...produtos, columns: { kind: 'DISCOVERED', exclude: [] } }
  const tables = sankhya.tables ?? assert.fail()
  const declared = tables.declared.map((table) => (table === produtos ? whole : table))
  const connector = defineConnector({ ...sankhya, tables: { ...tables, declared } })
  const found = (await discoverTables({ ...reach, connector })).find(
    ({ declaration }) => declaration === whole,
  )
  const image = found?.columns?.find(({ name }) => name === 'IMAGEM')
  assert.deepEqual(image, { name: 'IMAGEM', type: 'binary', description: 'Campo imagem' })
  const page = await readTablePage({
    ...reach,
    table: whole,
    columns: [{ name: 'CODPROD', type: 'bigint', description: null }, image ?? assert.fail()],
    filter: { kind: 'ALL' },
    after: null,
  })
  assert.equal(page.kind, 'PAGE')
  if (page.kind !== 'PAGE') return
  assert.deepEqual(
    Buffer.from(page.rows[0]?.IMAGEM ?? '', 'base64'),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 255]),
    'os bytes iguais aos da fonte',
  )
  const unknown = (await columnsOf('notas')).find(({ name }) => name === UNKNOWN_TYPE_COLUMN)
  assert.deepEqual(unknown, {
    name: UNKNOWN_TYPE_COLUMN,
    type: 'text',
    description: `Campo ${UNKNOWN_TYPE_COLUMN.toLowerCase()} (tipo X, VARCHAR2)`,
  })
})

test('a página em bytes: no máximo as linhas da página, menos linhas depois de uma resposta que passa dos bytes, e 450 colunas sem teto', async () => {
  const fake = sankhyaFake()
  const reach = await tableReachOf(sankhya, fake)
  const asked: number[] = []
  const send = sendTo(sankhya, fake)
  const counting: typeof send = (request, a) => {
    const { sql } = z
      .object({ requestBody: z.object({ sql: z.string() }) })
      .parse(request.body).requestBody
    asked.push(Number(/FETCH NEXT (\d+) ROWS ONLY$/.exec(sql)?.[1]))
    return send(request, a)
  }
  const tables = sankhya.tables ?? assert.fail()
  const readTable = tables.readTable ?? assert.fail()
  const connector = defineConnector({
    ...sankhya,
    tables: { ...tables, readTable: { ...readTable, page: { rows: 2, bytes: 1_048_576 } } },
  })
  const nfe = tableOf('notas_nfe')
  const columns = await columnsOf('notas_nfe')
  const rows: Record<string, string | null>[] = []
  let after: TablePosition | null = null
  do {
    const page = await readTablePage({
      ...reach,
      connector,
      send: counting,
      table: nfe,
      columns,
      filter: { kind: 'ALL' },
      after,
    })
    if (page.kind !== 'PAGE') return assert.fail(page.code)
    rows.push(...page.rows)
    after = page.next
  } while (after !== null)
  assert.deepEqual(
    asked,
    [2, 1, 2],
    'a primeira passou de 1 MiB com o XML grande; a seguinte pede uma; a linha estreita volta às duas',
  )
  assert.equal(rows.length, 3)
  assert.equal(rows[1]?.XML?.length, LARGE_XML_BYTES, 'o XML inteiro')

  const wide = await columnsOf('notas')
  assert.equal(wide.length, WIDE_COLUMNS)
  const page = await readTablePage({
    ...reach,
    table: tableOf('notas'),
    columns: wide,
    filter: { kind: 'ALL' },
    after: null,
  })
  assert.equal(page.kind, 'PAGE')
  if (page.kind === 'PAGE') assert.equal(Object.keys(page.rows[0] ?? {}).length, WIDE_COLUMNS)
})

test('o teto da coluna de alteração: o maior valor da tabela no texto da página, e o de uma alteração depois dele', async () => {
  const fake = sankhyaFake()
  const reach = await tableReachOf(sankhya, fake)
  const table = tableOf('notas')
  const columns = await columnsOf('notas')
  const before = await tableCeiling({ ...reach, table, columns })
  const rows = await walkTable(reach, table, { kind: 'ALL' }, columns)
  if (before.kind !== 'CEILING') return assert.fail()
  const read = rows.map((row) => row.DTALTER ?? '').sort()
  assert.equal(before.value, read.at(-1), 'o maior DTALTER, como a página o escreve')
  await fake.handle(
    new Request(new URL('/__teste/notas/100000', sankhya.origin), {
      method: 'POST',
      body: JSON.stringify({ acao: 'ALTERAR' }),
    }),
  )
  assert.deepEqual(await tableCeiling({ ...reach, table, columns }), {
    kind: 'CEILING',
    value: '2026-11-20T10:00:00',
  })
})

test('os meses da contagem: os que a tabela tem, os fora do calendário incluídos, e a página de um mês só traz o mês', async () => {
  const reach = await tableReachOf(sankhya, sankhyaFake())
  const table = tableOf('efd_st_media_diaria')
  assert.deepEqual(await tableMonths({ ...reach, table }), {
    kind: 'MONTHS',
    months: WINDOW_MONTHS,
  })
  const columns = await columnsOf('efd_st_media_diaria')
  for (const month of WINDOW_MONTHS) {
    const page = await readTablePage({
      ...reach,
      table,
      columns,
      filter: { kind: 'MONTH', column: 'DTREF', month },
      after: null,
    })
    if (page.kind !== 'PAGE') return assert.fail(page.code)
    assert.deepEqual(
      page.rows.map((row) => row.DTREF),
      [`${month}-01`, `${month}-01`],
      month,
    )
  }
})

test('o que a data limita: as quatro de movimento e as de janela; os cadastros e as inteiras nunca', () => {
  const limited = (sankhya.tables?.declared ?? [])
    .filter(({ mode }) => startDateLimits(mode))
    .map(({ name, mode }) => [name, mode.kind === 'FULL' ? null : mode.column])
  assert.deepEqual(limited, [
    ['notas', 'DTALTER'],
    ['notas_itens', 'DTALTER'],
    ['financeiro', 'DTALTER'],
    ['notas_impostos', 'DHALTER'],
    ['efd_st_media_diaria', 'DTREF'],
    ['estoque_contagens', 'DTCONTAGEM'],
    ['lancamentos_contabeis', 'REFERENCIA'],
  ])
  for (const name of ['parceiros', 'produtos', 'vendedores', 'precos_tabelas'])
    assert.partialDeepStrictEqual(tableOf(name).mode, { kind: 'CHANGED', registry: true }, name)
})

test('a data inicial e o ponto salvo: a página só traz o que mudou desde eles, e a linha sem data fica fora', async () => {
  const reach = await tableReachOf(sankhya, sankhyaFake())
  const table = tableOf('notas_itens')
  const columns = await columnsOf('notas_itens')
  async function read(filter: Parameters<typeof readTablePage>[0]['filter']) {
    const page = await readTablePage({ ...reach, table, columns, filter, after: null })
    return page.kind === 'PAGE' ? page.rows : assert.fail(page.code)
  }
  const all = await read({ kind: 'ALL' })
  assert.equal(all.filter((row) => row.DTALTER === null).length, 1, 'o item sem DTALTER')
  const since = await read({ kind: 'SINCE', column: 'DTALTER', after: '2026-10-20' })
  assert.ok(since.length > 0)
  assert.ok(since.every((row) => (row.DTALTER ?? '') >= '2026-10-20'))
  const point = await read({ kind: 'SINCE', column: 'DTALTER', after: '2026-10-31T18:30:00' })
  assert.deepEqual(new Set(point.map((row) => row.DTALTER)), new Set(['2026-10-31T18:30:00']))
})

test('a coluna que o dicionário não lista: a descoberta a traz pelo tipo do Oracle, e um teto sem a coluna do modo é a fonte ilegível', async () => {
  const empresas = await columnsOf('empresas')
  assert.deepEqual(
    empresas.find(({ name }) => name === OUTSIDE_DICTIONARY.column),
    { name: 'DHALTER', type: 'timestamp', description: 'DHALTER' },
  )
  const reach = await tableReachOf(sankhya, sankhyaFake())
  const table = tableOf('empresas')
  const ceiling = await tableCeiling({ ...reach, table, columns: empresas })
  assert.deepEqual(ceiling, { kind: 'CEILING', value: '2026-11-11T08:30:00' })
  const without = empresas.filter(({ name }) => name !== 'DHALTER')
  assert.deepEqual(await tableCeiling({ ...reach, table, columns: without }), {
    kind: 'FAILED',
    code: 'COPY_SOURCE_UNREADABLE',
    system: null,
    waitMs: null,
    smaller: false,
    rows: null,
    bodyBytes: null,
  })
})

test('o Sankhya trata as quatro tabelas de venda, cada coluna lida de uma que a tabela copiada tem, e a data da negociação em DATE', async () => {
  const found = await discoverTables(await tableReachOf(sankhya, sankhyaFake()))
  const treated = found.flatMap(({ declaration: { name, treated }, columns }) => {
    if (treated === undefined) return []
    assert.ok(treated.description.length > 0, name)
    const source = new Set(columns?.map((column) => column.name.toLowerCase()))
    const read = treated.columns.map(({ column, as, cast }) => {
      assert.ok(source.has(column), `${name}: ${column}`)
      assert.equal(as, column)
      return cast === 'KEEP' ? column : `${column}:${cast}`
    })
    return [[name, read.join(' ')]]
  })
  assert.deepEqual(Object.fromEntries(treated), {
    notas:
      'nunota numnota codemp codtipoper tipmov statusnota dtneg:DATE codparc codvend vlrnota dtalter',
    notas_itens: 'nunota sequencia codprod qtdneg vlrunit vlrtot codvol dtalter',
    parceiros: 'codparc nomeparc razaosocial cgc_cpf tippessoa ativo cliente fornecedor dtalter',
    produtos: 'codprod descrprod referencia codgrupoprod codvol marca ativo dtalter',
  })
  const notas = tableOf('notas').treated ?? assert.fail()
  const sql = treatedSelect(lakeNameOf('sankhya_', 'notas'), notas)
  assert.ok(sql.includes('\n  CAST("dtneg" AS DATE) AS "dtneg",\n'), sql)
  assert.ok(sql.includes('\n  "vlrnota" AS "vlrnota",\n'), sql)
})
