import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hubspot } from '../hubspot/definition.ts'
import type { Connector, TableDeclaration, TableReach } from '../index.ts'
import {
  DISCOVERED_TYPES,
  discoverTables,
  HUBSPOT_DISCOVERY,
  hubspotFake,
  lakeNameOf,
  readTablePage,
  SANKHYA_DISCOVERY,
  sankhyaFake,
  sourceOf,
  startDateLimits,
  suggestedLakeName,
  TABLE_SOURCE_FAILURES,
  TableName,
} from '../index.ts'
import { sankhya } from '../sankhya/definition.ts'
import { tableReachOf, walkTable } from './conformance-tables.ts'
import { ConnectorId } from './definition.ts'

function modeOf(table: TableDeclaration): string {
  const { mode } = table
  if (mode.kind === 'FULL') return 'FULL'
  if (mode.kind === 'WINDOW') return `WINDOW ${mode.column} ${mode.reread}`
  return `CHANGED ${mode.column}${mode.registry ? ' registry' : ''}`
}

async function discovered(reach: TableReach) {
  return (await discoverTables(reach)).map(({ declaration, columns }) => ({
    row: {
      name: declaration.name,
      source: sourceOf(declaration),
      key: declaration.key,
      mode: modeOf(declaration),
      limited: startDateLimits(declaration.mode),
      columns: columns?.length ?? null,
    },
    types: Object.fromEntries((columns ?? []).map(({ name, type }) => [name, type])),
  }))
}

function tableOf(connector: Connector, name: string): TableDeclaration {
  return connector.tables?.declared.find((table) => table.name === name) ?? assert.fail(name)
}

test('a descoberta é a lista esperada: as tabelas, as origens, as chaves, os modos e as colunas dos dois dublês', async () => {
  const sankhyaFound = await discovered(await tableReachOf(sankhya, sankhyaFake()))
  assert.deepEqual(
    sankhyaFound.map(({ row }) => row),
    SANKHYA_DISCOVERY,
  )
  const hubspotFound = await discovered(await tableReachOf(hubspot, hubspotFake()))
  assert.deepEqual(
    hubspotFound.map(({ row }) => row),
    HUBSPOT_DISCOVERY,
  )
  for (const [name, types] of Object.entries(DISCOVERED_TYPES)) {
    const found = [...sankhyaFound, ...hubspotFound].find(({ row }) => row.name === name)
    assert.partialDeepStrictEqual(found?.types, types, name)
  }
  assert.ok(
    !sankhyaFound.some(({ types }) => 'VLRLIQCALC' in types),
    'o campo calculado só existe na tela',
  )
})

test('uma página de cada origem: a tabela pela leitura do conector, a operação pela paginação dela, e a última diz que acabou', async () => {
  const reach = await tableReachOf(sankhya, sankhyaFake())
  const [notas] = (await discoverTables(reach)).filter(
    ({ declaration }) => declaration.name === 'notas',
  )
  const columns = notas?.columns ?? assert.fail('notas')
  const page = await readTablePage({
    ...reach,
    table: tableOf(sankhya, 'notas'),
    columns,
    filter: { kind: 'ALL' },
    after: null,
  })
  assert.equal(page.kind, 'PAGE')
  if (page.kind !== 'PAGE') return
  assert.equal(page.rows.length, 184, 'as notas do dublê numa página de 5.000')
  assert.equal(page.next, null, 'a página mais curta que a pedida é a última')
  assert.deepEqual(
    Object.keys(page.rows[0] ?? {}),
    columns.map(({ name }) => name),
  )
  assert.partialDeepStrictEqual(page.rows[0], {
    NUNOTA: '100000',
    DTNEG: '2026-09-01',
    DTALTER: '2026-09-01T18:30:00',
    VLRNOTA: '353.8',
  })

  const deals = await walkTable(
    await tableReachOf(hubspot, hubspotFake()),
    tableOf(hubspot, 'negocios'),
  )
  assert.equal(deals.length, 230, 'os 230 negócios, em três páginas do cursor')
  assert.equal(new Set(deals.map((deal) => deal.id)).size, 230)
  assert.deepEqual(deals[0], {
    id: '3000',
    dealname: 'Negócio fictício 1',
    dealstage: 'qualifiedtobuy',
    pipeline: 'default',
    amount: '1000',
    closedate: '2026-09-10T12:00:00.000Z',
    createdate: '2026-09-10T12:00:00.000Z',
    hs_lastmodifieddate: '2026-09-10T12:00:00.000Z',
  })
})

test('a fonte recusa: um dos quatro códigos, o que o sistema disse sem o corpo, e a espera do 429', async () => {
  const notas = tableOf(sankhya, 'notas_itens')
  const columns = [{ name: 'NUNOTA', type: 'bigint', description: null } as const]
  async function failed(change: (fake: ReturnType<typeof sankhyaFake>) => void) {
    const fake = sankhyaFake()
    const reach = await tableReachOf(sankhya, fake)
    change(fake)
    const read = await readTablePage({
      ...reach,
      table: notas,
      columns,
      filter: { kind: 'ALL' },
      after: null,
    })
    assert.equal(read.kind, 'FAILED')
    if (read.kind !== 'FAILED') return assert.fail()
    assert.ok(TABLE_SOURCE_FAILURES.includes(read.code))
    assert.ok(read.system === null || !('body' in read.system), 'nunca o corpo')
    return read
  }
  assert.deepEqual(await failed((fake) => fake.switches.refuse.add('consultar')), {
    kind: 'FAILED',
    code: 'COPY_SOURCE_REFUSED',
    system: { status: 200, code: '0', message: 'Serviço recusado' },
    waitMs: null,
  })
  assert.equal(
    (await failed((fake) => fake.expireTokens())).code,
    'COPY_SOURCE_NEEDS_REAUTH',
    'o token terminou e a renovação não abriu outro',
  )
  assert.equal(
    (
      await failed((fake) => {
        fake.switches.busyReads = 1
      })
    ).code,
    'COPY_SOURCE_UNREACHABLE',
  )
  assert.equal(
    (
      await failed((fake) => {
        fake.switches.malformed = true
      })
    ).code,
    'COPY_SOURCE_UNREADABLE',
  )
  const hub = hubspotFake()
  const reach = await tableReachOf(hubspot, hub)
  hub.switches.readRefused = true
  const refused = await readTablePage({
    ...reach,
    table: tableOf(hubspot, 'negocios'),
    columns: [],
    filter: { kind: 'ALL' },
    after: null,
  })
  assert.partialDeepStrictEqual(refused, {
    kind: 'FAILED',
    system: { status: 403, code: 'MISSING_SCOPES' },
  })
})

test('o que a data limita: só a tabela de movimento e a de janela; o cadastro e a inteira nunca', () => {
  assert.equal(startDateLimits({ kind: 'CHANGED', column: 'DTALTER', registry: false }), true)
  assert.equal(startDateLimits({ kind: 'CHANGED', column: 'DTALTER', registry: true }), false)
  assert.equal(startDateLimits({ kind: 'WINDOW', column: 'DTREF', step: 'MONTH', reread: 2 }), true)
  assert.equal(startDateLimits({ kind: 'FULL' }), false)
  for (const expected of [...SANKHYA_DISCOVERY, ...HUBSPOT_DISCOVERY])
    assert.equal(
      expected.limited,
      expected.mode.startsWith('WINDOW') ||
        (expected.mode.startsWith('CHANGED') && !expected.mode.endsWith('registry')),
      expected.name,
    )
})

test('o nome no lago: o prefixo do conector, o da ligação quando o nome já existe, e nunca acima de 60', () => {
  const sankhyaId = ConnectorId.parse('sankhya')
  const notas = TableName.parse('notas')
  assert.equal(lakeNameOf('sankhya_', 'notas'), 'sankhya_notas')
  assert.throws(() => lakeNameOf('sankhya_', 'x'.repeat(53)), RangeError)
  function free() {
    return false
  }
  assert.equal(
    suggestedLakeName({
      connector: sankhyaId,
      table: notas,
      connectionName: 'Matriz',
      taken: free,
    }),
    'sankhya_notas',
  )
  function taken(name: string) {
    return name === 'sankhya_notas'
  }
  assert.equal(
    suggestedLakeName({
      connector: sankhyaId,
      table: notas,
      connectionName: 'Filial São João',
      taken,
    }),
    'sankhya_filial_sao_joao_notas',
  )
  const long = suggestedLakeName({
    connector: ConnectorId.parse('mercado-livre'),
    table: TableName.parse('periodos_de_faturamento'),
    connectionName: 'Loja oficial da empresa no marketplace',
    taken: () => true,
  })
  assert.equal(long, 'mercado_livre_loja_oficial_da_empres_periodos_de_faturamento')
  assert.equal(long.length, 60)
  assert.throws(() => TableName.parse('Notas'), 'só minúsculas')
  assert.throws(() => TableName.parse('x'.repeat(41)), 'até 40')
})
