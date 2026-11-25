import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PersonId } from '@conexus/hub-api'
import { readerAt } from '../access/test-principal.ts'
import { linkMercadoLivre, mercadoLivreOn, testOf } from '../connectors/test-connections.ts'
import { SANKHYA_DISCOVERY, SANKHYA_GROUPS } from '../connectors/test-copy-source.ts'
import { call, codeOf, personOn } from '../identity/test-hub.ts'
import { DAILY, lakeCopyOn, NOTAS, PARCEIROS } from './test-lake-copy.ts'

function modeText(mode: { kind: string; column?: string; registry?: boolean }): string {
  if (mode.kind === 'FULL') return 'FULL'
  return `${mode.kind} ${mode.column}${mode.registry === true ? ' registry' : ''}`
}

test('a lista da ligação: as tabelas do kit, nada marcado, com o nome sugerido e o dicionário', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked('Matriz')
  const view = on.viewOf(await on.get(connection))
  assert.deepEqual(view.lake, { kind: 'READY' })
  assert.equal(view.interval, null)
  assert.equal(view.startDate, null)
  assert.equal(view.lastRun, null)
  assert.equal(view.tables.length, SANKHYA_DISCOVERY.length)
  for (const table of view.tables) {
    const expected = SANKHYA_DISCOVERY.find((each) => each.source === table.source)
    assert.ok(expected !== undefined, table.source)
    assert.deepEqual(table.copy, { kind: 'UNMARKED', suggested: `sankhya_${expected.name}` })
    assert.equal(table.limited, expected.limited, `${table.source} limited`)
    assert.equal(table.columns, expected.columns, `${table.source} columns`)
    assert.ok(table.label.length > 0 && (table.description ?? '').length > 0)
    assert.ok(SANKHYA_GROUPS.has(table.group), `${table.source} group`)
  }

  on.fake.switches.notJson = true
  const without = on.viewOf(await on.get(connection))
  assert.equal(without.tables.length, view.tables.length)
  assert.ok(without.tables.every((table) => table.columns === null))
  assert.deepEqual(
    without.tables.map(({ label, description }) => [label, description]),
    view.tables.map(({ label, description }) => [label, description]),
    'the dictionary out: the kit label and description stay',
  )
  on.fake.switches.notJson = false

  const stranger = await personOn(on.hub, { name: 'Fora', email: 'fora@example.test' })
  const outside = await on.get(connection, stranger)
  assert.deepEqual([outside.statusCode, codeOf(outside)], [404, 'NOT_FOUND'])
  const unknown = await on.get('00000000-0000-4000-8000-000000000001')
  assert.deepEqual([unknown.statusCode, codeOf(unknown)], [404, 'NOT_FOUND'])
  const bia = await on.member('Bia', 'member')
  assert.equal((await on.get(connection, bia)).statusCode, 200, 'every member reads the list')
})

test('a lista da ligação é a descoberta: cada tabela, origem, modo e coluna da lista de todos', async (t) => {
  const on = await lakeCopyOn(t)
  const view = on.viewOf(await on.get(await on.linked()))
  assert.deepEqual(
    view.tables.map((table) => ({
      name: table.copy.kind === 'UNMARKED' ? table.copy.suggested : '',
      source: table.source,
      mode: modeText(table.mode),
      limited: table.limited,
      columns: table.columns,
    })),
    SANKHYA_DISCOVERY.map((each) => ({
      name: `sankhya_${each.name}`,
      source: each.source,
      mode: each.mode.startsWith('WINDOW') ? each.mode.split(' ').slice(0, 2).join(' ') : each.mode,
      limited: each.limited,
      columns: each.columns,
    })),
  )
})

test('a lista de uma ligação de credencial exclusiva é indisponível, com o motivo', async (t) => {
  const on = await mercadoLivreOn(t)
  const linked = await linkMercadoLivre(on.hub, on.ana, on.companyId)
  assert.equal(linked.statusCode, 200, linked.body)
  const connection = String(Object(linked.json()).connection.id)
  const answered = await call(on.hub, on.ana, 'GET', `${on.base}/${connection}/lake-tables`)
  assert.equal(answered.statusCode, 200, answered.body)
  assert.deepEqual(Object(answered.json()).lake, {
    kind: 'UNAVAILABLE',
    reason: 'EXCLUSIVE_CREDENTIAL',
  })
  assert.deepEqual(Object(answered.json()).tables, [])
})

test('a segunda ligação: a sugestão leva o nome dela, e o nome repetido é recusado', async (t) => {
  const on = await lakeCopyOn(t)
  const first = await on.linked('Matriz')
  const second = await on.linked('Filial Sul')
  assert.equal((await on.put(first, { tables: [NOTAS], ...DAILY })).statusCode, 200)

  const view = on.viewOf(await on.get(second))
  const notas = view.tables.find((table) => table.source === 'TGFCAB')
  assert.deepEqual(notas?.copy, { kind: 'UNMARKED', suggested: 'sankhya_filial_sul_notas' })
  const parceiros = view.tables.find((table) => table.source === 'TGFPAR')
  assert.deepEqual(parceiros?.copy, { kind: 'UNMARKED', suggested: 'sankhya_parceiros' })

  const taken = await on.put(second, { tables: [NOTAS], ...DAILY })
  assert.deepEqual([taken.statusCode, codeOf(taken)], [409, 'COPY_NAME_TAKEN'])
  const named = await on.put(second, {
    tables: [{ source: 'TGFCAB', name: 'sankhya_filial_sul_notas' }],
    ...DAILY,
  })
  assert.equal(named.statusCode, 200, named.body)
  const [row] = await on.rows(`select count(*)::int as n from copies.lake_table`)
  assert.equal(row?.n, 2, 'one table of each connection')
})

test('a tabela do lago fica fora do banco: nenhum esquema, login ou tabela na empresa, e nada no catálogo que o Assistente lê', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  function shape() {
    return on.rows(
      `select (select count(*) from information_schema.schemata)::int as schemas,
              (select count(*) from pg_roles)::int as roles,
              (select count(*) from information_schema.tables where table_schema not in ('pg_catalog', 'information_schema'))::int as tables`,
    )
  }
  const [hubBefore] = await shape()
  const neonBefore = on.hub.neon.calls.length
  assert.equal((await on.put(connection, { tables: [NOTAS, PARCEIROS], ...DAILY })).statusCode, 200)
  await on.hub.lakeRuns.idle()
  const [hubAfter] = await shape()
  assert.deepEqual(hubAfter, hubBefore, 'no schema, role or table appeared')
  assert.equal(on.hub.neon.calls.length, neonBefore, 'the companies databases were not asked for')

  const tested = await testOf(on.hub, on.ana, on.base, connection)
  assert.equal(tested.statusCode, 200, tested.body)
  const scope = readerAt({
    companyId: on.companyId,
    personId: PersonId.parse(on.ana.id),
    place: { kind: 'COMPANY' },
  })
  const described = JSON.stringify(await on.hub.data(scope, { thread: null }).describe())
  for (const word of ['sankhya_notas', 'sankhya_parceiros', 'lake_table', 'lake_copy'])
    assert.equal(described.includes(word), false, `${word} is not in the catalog`)
})

test('a skill com os nomes reais: só as marcadas, com o nome da empresa, a origem e "desde" onde a data limita', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  assert.equal((await testOf(on.hub, on.ana, on.base, connection)).statusCode, 200)
  const scope = readerAt({
    companyId: on.companyId,
    personId: PersonId.parse(on.ana.id),
    place: { kind: 'COMPANY' },
  })
  async function skill() {
    const found = (await on.hub.connectors.assistant.connections(scope)).find(
      (each) => each.connectionId === connection,
    )
    assert.ok(found !== undefined)
    return found.skill.content
  }
  assert.equal(
    (await skill()).includes('As tabelas no lago'),
    false,
    'nothing marked, nothing listed',
  )

  const clientes = { source: 'TGFPAR', name: 'sankhya_clientes' }
  const put = await on.put(connection, {
    tables: [NOTAS, clientes],
    interval: '24h',
    startDate: '2025-01-01',
  })
  assert.equal(put.statusCode, 200, put.body)
  const content = await skill()
  assert.ok(content.includes('Cada tabela traz só as linhas desta ligação.'))
  function line(name: string) {
    return content.split('\n').find((each) => each.startsWith(`- \`${name}\``))
  }
  const notas = line('sankhya_notas')
  assert.ok(notas?.includes('Origem: `TGFCAB`.') && notas.endsWith('Desde 2025-01-01.'), notas)
  const parceiros = line('sankhya_clientes')
  assert.ok(parceiros?.includes('Origem: `TGFPAR`.'), parceiros)
  assert.equal(parceiros?.includes('Desde'), false, 'a registry table is not limited by the date')
  assert.equal(content.includes('sankhya_produtos'), false, 'an unmarked table is not listed')
})
