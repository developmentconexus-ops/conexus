import assert from 'node:assert/strict'
import { test } from 'node:test'
import pg from 'pg'
import type { CopyTable } from './copy-sql.ts'
import { testAppsConfig } from './test-cloudflare.ts'
import { createCompanyDatabase, syncLoginOf, testCompanyPostgres } from './test-company-postgres.ts'

type DatabaseUrl = Awaited<ReturnType<typeof createCompanyDatabase>>

const KEY = testAppsConfig().appLoginKey
const postgres = testCompanyPostgres(KEY)

function syncOf(owner: DatabaseUrl) {
  return syncLoginOf(owner, KEY)
}

async function asSync(sync: DatabaseUrl, text: string) {
  const client = new pg.Client({ connectionString: sync.reveal() })
  await client.connect()
  try {
    return (await client.query(text)).rows
  } finally {
    await client.end()
  }
}

const PEDIDOS: CopyTable = {
  name: 'pedidos',
  definition: {
    columns: [
      { name: 'id', type: 'text', description: 'O número do pedido' },
      { name: 'itens', type: 'json', description: 'Os itens, como vieram' },
      { name: 'criado', type: 'timestamp' },
    ],
    key: ['id'],
    changedSince: null,
    description: 'Os pedidos de cada loja',
  },
  accounts: true,
  instants: 'OFFSET',
}

test('json, chave de texto e descrições', async (t) => {
  const owner = await createCompanyDatabase(t)
  assert.equal((await postgres.ensureSync(owner)).kind, 'DONE')
  const sync = await syncOf(owner)
  assert.equal((await postgres.ensureCopyTable(sync, PEDIDOS)).kind, 'DONE')
  assert.equal((await postgres.ensureCopyTable(sync, PEDIDOS)).kind, 'DONE', 'repetível')
  await asSync(
    sync,
    `insert into sync.pedidos (id, itens, criado, _account, _account_name, _pass)
     values ('MLB1', '[{"quantidade":1},{"quantidade":2}]'::jsonb, '2026-11-10T10:00:00-03:00', '42', 'Loja Centro', 0)`,
  )

  const [row] = await asSync(
    sync,
    `select id, _account, _account_name,
       (select count(*) from jsonb_array_elements(itens))::int as itens,
       criado = '2026-11-10T13:00:00Z'::timestamptz as instante
     from sync.pedidos`,
  )
  assert.deepEqual(row, {
    id: 'MLB1',
    _account: '42',
    _account_name: 'Loja Centro',
    itens: 2,
    instante: true,
  })
  const types = await asSync(
    sync,
    `select attname, format_type(atttypid, atttypmod) as type from pg_attribute
     where attrelid = 'sync.pedidos'::regclass and attnum > 0 order by attnum`,
  )
  assert.deepEqual(Object.fromEntries(types.map((each) => [each.attname, each.type])), {
    id: 'text',
    itens: 'jsonb',
    criado: 'timestamp with time zone',
    _account: 'text',
    _account_name: 'text',
    _pass: 'integer',
  })
  const [key] = await asSync(
    sync,
    `select pg_get_constraintdef(oid) as key from pg_constraint
     where conrelid = 'sync.pedidos'::regclass and contype = 'p'`,
  )
  assert.equal(key?.key, 'PRIMARY KEY (_account, id)')
  const [described] = await asSync(
    sync,
    `select obj_description('sync.pedidos'::regclass, 'pg_class') as tabela,
       col_description('sync.pedidos'::regclass, 1) as id,
       col_description('sync.pedidos'::regclass, 2) as itens,
       col_description('sync.pedidos'::regclass, 3) as criado`,
  )
  assert.deepEqual(described, {
    tabela: 'Os pedidos de cada loja',
    id: 'O número do pedido',
    itens: 'Os itens, como vieram',
    criado: null,
  })
})

test('uma descrição com aspas e ponto e vírgula fica como texto', async (t) => {
  const owner = await createCompanyDatabase(t)
  await postgres.ensureSync(owner)
  const sync = await syncOf(owner)
  const said = "Pedidos'; DROP TABLE sync.pedidos; --"
  const table: CopyTable = { ...PEDIDOS, definition: { ...PEDIDOS.definition, description: said } }
  assert.equal((await postgres.ensureCopyTable(sync, table)).kind, 'DONE')
  const [described] = await asSync(
    sync,
    `select obj_description('sync.pedidos'::regclass, 'pg_class') as tabela`,
  )
  assert.equal(described?.tabela, said)
})

test('a versão 1 guarda a hora local, sem as colunas da conta', async (t) => {
  const owner = await createCompanyDatabase(t)
  await postgres.ensureSync(owner)
  const sync = await syncOf(owner)
  const table: CopyTable = {
    name: 'vendas',
    definition: {
      columns: [
        { name: 'NUNOTA', type: 'bigint' },
        { name: 'DTNEG', type: 'timestamp' },
      ],
      key: ['NUNOTA'],
      changedSince: null,
    },
    accounts: false,
    instants: 'LOCAL',
  }
  assert.equal((await postgres.ensureCopyTable(sync, table)).kind, 'DONE')
  const types = await asSync(
    sync,
    `select attname, format_type(atttypid, atttypmod) as type from pg_attribute
     where attrelid = 'sync.vendas'::regclass and attnum > 0 order by attnum`,
  )
  assert.deepEqual(
    types.map((each) => [each.attname, each.type]),
    [
      ['NUNOTA', 'bigint'],
      ['DTNEG', 'timestamp without time zone'],
      ['_pass', 'integer'],
    ],
  )
})
