import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { AppRows } from '@conexus/hub-api'
import type { Person } from '../identity/test-hub.ts'
import { call, memberOn } from '../identity/test-hub.ts'
import { companyForVersions, folder, MIGRATION, send } from './test-versions.ts'

const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
export const DORA = { name: 'Dora Reis', email: 'dora@example.test' }
export const CLIENTES = 'clientes'
export const QUOTED = 'a"b c'

function columns(count: number, type: string) {
  return Array.from({ length: count }, (_, at) => `c${at + 1} ${type}`).join(', ')
}

/** The tables of the app of a Projeto that has stored clients: a key, a composite key, none, nothing. */
export const SEED = {
  id: '002_dados',
  statements: [
    `CREATE TABLE ${CLIENTES} (id int PRIMARY KEY, nome text NOT NULL)`,
    `INSERT INTO ${CLIENTES} SELECT n, 'cliente ' || n FROM generate_series(10001, 1, -1) AS n`,
    'CREATE TABLE item_pedido (pedido int, item int, qtd int, PRIMARY KEY (item, pedido))',
    'INSERT INTO item_pedido SELECT p, i, p * i FROM generate_series(3, 1, -1) p, generate_series(40, 1, -1) i',
    'CREATE TABLE sem_chave (n int, texto text)',
    "INSERT INTO sem_chave SELECT n, 'linha ' || n FROM generate_series(1, 120) AS n",
    'CREATE TABLE vazia (id int PRIMARY KEY, nota text)',
    // Built under another name and renamed: `INSERT INTO pg_class` would find the catalog's own.
    'CREATE TABLE classe (id int PRIMARY KEY, nota text)',
    "INSERT INTO classe VALUES (1, 'a'), (2, 'b')",
    'ALTER TABLE classe RENAME TO pg_class',
    `CREATE TABLE "${QUOTED.replaceAll('"', '""')}" (id int PRIMARY KEY)`,
    `INSERT INTO "${QUOTED.replaceAll('"', '""')}" VALUES (1)`,
    'CREATE TABLE tipos (id int PRIMARY KEY, n numeric(12,3), quando timestamptz, ok boolean, doc jsonb, bin bytea)',
    `INSERT INTO tipos VALUES (1, 12.5, '2026-11-09 12:00:00+00', true, '{"a": 1, "b": [1, 2]}', '\\xdeadbeef'), (2, NULL, NULL, NULL, NULL, NULL)`,
  ],
}

export const WIDE_TEXT = {
  id: '003_texto_longo',
  statements: [
    `CREATE TABLE texto_longo (id int PRIMARY KEY, ${columns(30, 'text')})`,
    `INSERT INTO texto_longo SELECT n, ${Array.from({ length: 30 }, () => "repeat('x', 24000)").join(', ')} FROM generate_series(1, 52) AS n`,
  ],
}

export const WIDE_COLUMNS = {
  id: '003_colunas',
  statements: [
    `CREATE TABLE colunas (id int PRIMARY KEY, ${columns(200, 'text')})`,
    `INSERT INTO colunas SELECT n, ${Array.from({ length: 200 }, () => "repeat('é', 100)").join(', ')} FROM generate_series(1, 60) AS n`,
  ],
}

/** Empresa A with its Projeto Pedidos, whose app holds the seed's tables, and every role that may or may not look. */
export async function dataOn(t: TestContext, ...more: (typeof SEED)[]) {
  const on = await companyForVersions(t)
  const { hub, companyId } = on
  const sent = await send(on, on.ana, folder({ migrations: [MIGRATION, SEED, ...more] }))
  assert.equal(sent.preview?.state, 'ready')
  const admin = await memberOn(hub, companyId, CARLA, 'admin')
  const developer = await memberOn(hub, companyId, DORA, 'developer')
  const base = `/api/companies/${companyId}`
  const project = `${base}/projects/${on.projectId}`
  function tables(person: Person, at = project) {
    return call(hub, person, 'GET', `${at}/tables`)
  }
  function rows(person: Person, table: string, page?: string, at = project) {
    const query = page === undefined ? '' : `?page=${page}`
    return call(hub, person, 'GET', `${at}/tables/${encodeURIComponent(table)}/rows${query}`)
  }
  async function page(table: string, token?: string) {
    const response = await rows(on.ana, table, token)
    assert.equal(response.statusCode, 200, response.body)
    return AppRows.parse(response.json())
  }
  return { ...on, admin, developer, base, project, tables, rows, page }
}
