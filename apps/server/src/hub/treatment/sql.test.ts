import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readModelSql } from './sql.ts'

function inputsOf(sql: string) {
  const read = readModelSql(sql)
  assert.equal(read.kind, 'QUERY', `${sql} ${JSON.stringify(read)}`)
  return read.kind === 'QUERY' ? read.inputs.map(({ layer, table }) => `${layer}.${table}`) : []
}

for (const [form, sql, inputs] of [
  [
    'with, sem contar o nome da CTE',
    `with v as (select * from current.sankhya_notas), w as (select * from v)
     select * from w where v in (select v from w)`,
    ['current.sankhya_notas'],
  ],
  [
    'junção, com as tabelas em ordem',
    'select * from tratado.notas n left join current.parceiros p on p.id = n.parceiro',
    ['current.parceiros', 'tratado.notas'],
  ],
  [
    'subconsulta',
    `select * from (select * from negocio.venda) v
     where exists (select 1 from current.itens i where i.venda = v.id)`,
    ['current.itens', 'negocio.venda'],
  ],
  ['date_trunc', "select date_trunc('month', dia) from tratado.notas", ['tratado.notas']],
  ['try_cast', 'select try_cast(valor as decimal(10, 2)) from tratado.notas', ['tratado.notas']],
  [
    'expressão x -> x',
    'select transform(itens, x -> x.valor) from tratado.notas',
    ['tratado.notas'],
  ],
  [
    'a mesma tabela duas vezes, com aspas e em maiúsculas',
    'select * from "current"."Itens" union all select * from CURRENT.itens',
    ['current.itens'],
  ],
  [
    'comentário antes, comentário com ponto e vírgula e ponto e vírgula no fim',
    '-- regra; da venda\n/* ; */ select * from current.itens;',
    ['current.itens'],
  ],
  ['consulta sem tabela', 'select 1', []],
] as const) {
  test(`leitor de SQL aceita ${form}`, () => {
    assert.deepEqual(inputsOf(sql), inputs)
  })
}

test('leitor de SQL não escreve no console ao ler um join ... on true', (t) => {
  const written = (['log', 'warn', 'error'] as const).map((level) =>
    t.mock.method(console, level, () => undefined),
  )
  assert.deepEqual(inputsOf('select * from current.a join current.b on true'), [
    'current.a',
    'current.b',
  ])
  assert.deepEqual(
    written.map((method) => method.mock.callCount()),
    [0, 0, 0],
  )
})

for (const sql of [
  "select * from {{ ref('notas') }}",
  'select 1 {% if true %}',
  'select 1 {# nota #}',
]) {
  test(`leitor de SQL recusa Jinja: ${sql}`, () => {
    assert.deepEqual(readModelSql(sql), {
      kind: 'REFUSED',
      code: 'TREATMENT_SQL_TEMPLATE',
      detail: {},
    })
  })
}

test('leitor de SQL recusa o SQL que não abre, com a linha e a coluna', () => {
  assert.deepEqual(readModelSql('select *\nfrom current.a\nwhere ('), {
    kind: 'REFUSED',
    code: 'TREATMENT_SQL_INVALID',
    detail: { position: { line: 3, column: 8 } },
  })
})

for (const sql of [
  'select 1; select 2',
  'select * from current.a; delete from current.a',
  'select * from current.a select * from current.b',
  'insert into current.a select 1',
  'table current.a',
  '(select * from current.a)',
  '',
  '-- só um comentário',
]) {
  test(`leitor de SQL recusa o que não é uma consulta só: ${JSON.stringify(sql)}`, () => {
    assert.deepEqual(readModelSql(sql), {
      kind: 'REFUSED',
      code: 'TREATMENT_SQL_NOT_A_QUERY',
      detail: {},
    })
  })
}

for (const [sql, table] of [
  ['select * from sankhya_notas', 'sankhya_notas'],
  ['select * from raw.sankhya_notas', 'raw.sankhya_notas'],
  ['select * from awsdatacatalog.current.a', 'awsdatacatalog.current.a'],
  ['select * from "current.a"', '"current.a"'],
  ['select * from current.a union table raw.b', 'raw.b'],
  ['select * from current.a where k in (select k from raw.b)', 'raw.b'],
  ['with x as (select 1) select * from raw.x', 'raw.x'],
  ['with "raw.x" as (select 1) select * from raw.x', '"raw.x"'],
  ['with `raw.x` as (select 1) select * from raw.x', '`raw.x`'],
  ['select * from (with y as (select 1) select * from y) s, y', 'y'],
  ['with recursive r(n) as (select 1 union all select n + 1 from r) select * from r', 'r'],
] as const) {
  test(`leitor de SQL recusa a tabela sem área ou de outra área: ${sql}`, () => {
    assert.deepEqual(readModelSql(sql), {
      kind: 'REFUSED',
      code: 'TREATMENT_INPUT_UNQUALIFIED',
      detail: { table },
    })
  })
}
