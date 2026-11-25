import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ExpectedTable } from '@conexus/connectors'
import {
  HUBSPOT_DISCOVERY,
  SANKHYA_DISCOVERY,
  sankhyaFake,
  tablePrefixOf,
} from '@conexus/connectors'
import { z } from 'zod'
import type { Double } from './test-tap.ts'
import { hubspotDouble, lastState, recordsOf, sankhyaDouble, selected, tap } from './test-tap.ts'

const Entry = z.object({
  stream: z.string(),
  table_name: z.string(),
  key_properties: z.array(z.string()),
  schema: z.object({
    properties: z.record(z.string(), z.object({ description: z.string().optional() }).loose()),
  }),
  metadata: z.array(
    z.object({ breadcrumb: z.array(z.string()), metadata: z.record(z.string(), z.unknown()) }),
  ),
})

const Mode = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('FULL') }),
  z.object({ kind: z.literal('CHANGED'), column: z.string(), registry: z.boolean() }),
  z.object({ kind: z.literal('WINDOW'), column: z.string(), reread: z.int() }),
])

function rowOf(entry: z.infer<typeof Entry>, prefix: string): ExpectedTable {
  const top = entry.metadata.find(({ breadcrumb }) => breadcrumb.length === 0)?.metadata ?? {}
  const mode = Mode.parse(top['conexus-mode'])
  const columns = Object.keys(entry.schema.properties).length
  return {
    name: entry.stream.slice(prefix.length),
    source: entry.table_name,
    key: entry.key_properties,
    mode:
      mode.kind === 'FULL'
        ? 'FULL'
        : mode.kind === 'WINDOW'
          ? `WINDOW ${mode.column} ${mode.reread}`
          : `CHANGED ${mode.column}${mode.registry ? ' registry' : ''}`,
    limited: z.boolean().parse(top['conexus-limited']),
    columns: columns === 0 ? null : columns,
  }
}

async function catalogOf(double: Double) {
  const run = await tap(double, { args: ['--discover', '--config', '<config>'] })
  assert.equal(run.code, 0)
  return z.object({ streams: z.array(Entry) }).parse(JSON.parse(run.lines.join('')))
}

test('o catálogo é a descoberta: a lista esperada do kit que o dicionário tem, nada marcado, as colunas em minúsculas com a descrição', async () => {
  for (const [double, expected] of [
    [sankhyaDouble(), SANKHYA_DISCOVERY],
    [await hubspotDouble(), HUBSPOT_DISCOVERY],
  ] as const) {
    const { streams } = await catalogOf(double)
    const prefix = tablePrefixOf(double.connector.id)
    assert.deepEqual(
      streams.map((entry) => rowOf(entry, prefix)),
      expected
        .filter(({ columns }) => columns !== null)
        .map((row) => ({ ...row, key: row.key.map((name) => name.toLowerCase()) })),
    )
    for (const entry of streams) {
      assert.equal(entry.stream.startsWith(prefix), true)
      const top = entry.metadata.find(({ breadcrumb }) => breadcrumb.length === 0)?.metadata
      assert.partialDeepStrictEqual(top, { selected: false, 'conexus-history': false })
      assert.equal(typeof top?.['conexus-label'], 'string')
      for (const name of Object.keys(entry.schema.properties))
        assert.equal(name, name.toLowerCase())
    }
  }
  const { streams } = await catalogOf(sankhyaDouble())
  const notas = streams.find(({ table_name }) => table_name === 'TGFCAB') ?? assert.fail()
  assert.equal(notas.stream, 'sankhya_notas')
  assert.equal(notas.schema.properties.nunota?.description, 'Campo nunota')
  const nfe = streams.find(({ table_name }) => table_name === 'TGFNFE') ?? assert.fail()
  const top = nfe.metadata.find(({ breadcrumb }) => breadcrumb.length === 0)?.metadata
  assert.deepEqual(top?.['conexus-meanings'], { XML: 'NFE_XML' })
  const { streams: deals } = await catalogOf(await hubspotDouble())
  assert.equal(
    deals[0]?.table_name,
    'negocios',
    'a origem de uma tabela por operação é o id da operação',
  )
})

test('a descoberta recusada: o dicionário que a fonte recusa para o tap com o código dela, nunca um catálogo sem colunas', async () => {
  const refusing = sankhyaFake()
  refusing.switches.refuse.add('consultar')
  const run = await tap(sankhyaDouble(refusing), { args: ['--discover', '--config', '<config>'] })
  assert.equal(run.code, 1)
  assert.deepEqual(run.lines, [])
  assert.partialDeepStrictEqual(run.result, { code: 'COPY_SOURCE_REFUSED', table: '' })
})

test('o nome da rodada: o fluxo leva o nome da configuração, que o Hub escreve', async () => {
  const double = sankhyaDouble()
  const run = await tap(double, {
    streams: [selected('TGFVEN', 'vendedores_do_catalogo')],
    configTables: [{ source: 'TGFVEN', name: 'sankhya_matriz_vendedores', whole: false }],
  })
  assert.equal(run.code, 0)
  assert.equal(recordsOf(run, 'vendedores_do_catalogo').length, 0)
  assert.ok(recordsOf(run, 'sankhya_matriz_vendedores').length > 0)
})

test('duas tabelas numa rodada: só as escolhidas, uma depois da outra, com o nome do catálogo e a versão da passada', async () => {
  const double = sankhyaDouble()
  const run = await tap(double, {
    streams: [
      selected('TGFCAB', 'vendas_notas'),
      { stream: 'sankhya_parceiros', table_name: 'TGFPAR', metadata: [] },
      selected('TGFITE', 'vendas_itens'),
    ],
  })
  assert.equal(run.code, 0)
  const order = run.messages
    .flatMap(({ type, stream }) =>
      type === 'RECORD' ? [] : [`${type}${stream === undefined ? '' : ` ${stream}`}`],
    )
    .filter(
      (message, at, all) => message !== 'STATE' || all[at - 1]?.startsWith('ACTIVATE_VERSION'),
    )
  assert.deepEqual(order, [
    'SCHEMA vendas_notas',
    'ACTIVATE_VERSION vendas_notas',
    'STATE',
    'SCHEMA vendas_itens',
    'ACTIVATE_VERSION vendas_itens',
    'STATE',
  ])
  assert.equal(recordsOf(run, 'vendas_notas').length, 184)
  const versions = new Set(
    run.messages.filter(({ type }) => type === 'RECORD').map(({ version }) => version),
  )
  assert.deepEqual(
    [...versions],
    [run.messages.find(({ type }) => type === 'ACTIVATE_VERSION')?.version],
  )
  assert.equal(recordsOf(run, 'sankhya_parceiros').length, 0, 'a tabela não escolhida fica fora')
  const first = recordsOf(run, 'vendas_notas')[0] ?? assert.fail()
  assert.equal(Object.keys(first).length, 450)
  assert.partialDeepStrictEqual(first, { nunota: 100000, dtneg: '2026-09-01', vlrnota: '353.8' })
})

test('a coluna do modo fora do dicionário: a TSIEMP inteira é lida, e o ponto é o teto de DHALTER (L.2)', async () => {
  const run = await tap(sankhyaDouble(), {
    streams: [selected('TSIEMP', 'empresas')],
    whole: ['TSIEMP'],
  })
  assert.equal(run.code, 0)
  assert.deepEqual(
    recordsOf(run, 'empresas').map((row) => row.dhalter),
    ['2026-11-10T08:30:00', '2026-11-11T08:30:00'],
  )
  assert.deepEqual(lastState(run).bookmarks?.empresas, {
    replication_key_value: '2026-11-11T08:30:00',
  })
})

test('a linha sem data: a primeira passada sem data inicial lê o item sem DTALTER (#940)', async () => {
  const run = await tap(sankhyaDouble(), { streams: [selected('TGFITE', 'itens')] })
  assert.equal(recordsOf(run, 'itens').filter((row) => row.dtalter === null).length, 1)
})

test('nada do segredo na saída: nenhum campo da credencial nem o token aparece no que o tap escreve', async () => {
  for (const double of [sankhyaDouble(), await hubspotDouble()]) {
    const source = double.connector.id === 'sankhya' ? 'TGFVEN' : 'negocios'
    const run = await tap(double, { streams: [selected(source, 'tabela')] })
    assert.equal(run.code, 0)
    const text = run.lines.join('\n')
    for (const value of Object.values(double.secret)) assert.equal(text.includes(value), false)
  }
})

test('a fonte recusa: código diferente de zero, o código da fonte e a tabela no arquivo de resultado, nunca o corpo', async () => {
  const streams = [selected('TGFVEN', 'vendedores'), selected('TGFCAB', 'notas')]
  const wrong = {
    ...sankhyaDouble(),
    secret: { ...sankhyaFake().credential, clientSecret: 'errada' },
  }
  const refusing = sankhyaFake()
  refusing.switches.refuse.add('consultar')
  refusing.switches.refuseMessage = `Chave ${refusing.credential.clientSecret} recusada`
  const malformed = sankhyaFake()
  malformed.switches.malformed = true
  const cases: [string, Double, string][] = [
    ['o login recusado', wrong, 'COPY_SOURCE_NEEDS_REAUTH'],
    ['o serviço recusado', sankhyaDouble(refusing), 'COPY_SOURCE_REFUSED'],
    ['a resposta que não se lê', sankhyaDouble(malformed), 'COPY_SOURCE_UNREADABLE'],
  ]
  for (const [what, double, code] of cases) {
    const run = await tap(double, { streams })
    assert.equal(run.code, 1, what)
    const result = z
      .object({ code: z.string(), table: z.string(), system: z.object({}).loose().nullable() })
      .strict()
      .parse(run.result)
    assert.equal(result.code, code, what)
    assert.equal(result.table, 'vendedores', what)
    assert.equal(JSON.stringify(result).includes('errada'), false)
    for (const value of Object.values(double.secret))
      assert.equal(
        JSON.stringify(result).includes(value),
        false,
        `${what}: nenhum valor do segredo`,
      )
  }
})
