import assert from 'node:assert/strict'
import { test } from 'node:test'
import { appLogin, ProjectId } from '@conexus/hub-api'
import pg from 'pg'
import type { Page } from 'playwright-core'
import type { DatabaseUrl } from '../../apps/server/src/platform/database.ts'
import { visitApp } from './apps-edge.ts'
import {
  GREEN,
  openApp,
  PURPLE,
  pedidosOf,
  RECADO,
  recados,
  scenario,
  sendFolder,
} from './apps-journey.ts'

// Step 10's journey: in Pedidos's Configurações, Ana sends a version that does not start, one that
// writes in `db.query` and one whose Travar never ends, and the version on the air, its data and the
// Hub stay as they were. Cloudflare's API and its namespace are doubles: the API runs a script's top
// level on upload and the namespace cuts a Worker past its CPU, as record 0047 saw; the app's `db`
// runs on the test server with the login the Hub made (testing T5, T6, T14).

const FAILED_PAGE = /<h1>O app não conseguiu responder agora\.<\/h1>/

/** The recados in the company's database itself, not as the app reports them. */
async function storedRecados(database: DatabaseUrl, pedidos: string): Promise<string[]> {
  const id = ProjectId.parse(/\/projects\/([^/?#]+)/.exec(pedidos)?.[1])
  const { schema, migrateLogin } = appLogin(id)
  const client = new pg.Client({ connectionString: database.reveal() })
  await client.connect()
  try {
    // The owner reaches the app's schema only as its migration login (decision 0043).
    await client.query('BEGIN')
    await client.query(`SET LOCAL ROLE "${migrateLogin}"`)
    const rows = await client.query(`SELECT texto FROM "${schema}".recado ORDER BY id`)
    await client.query('COMMIT')
    return rows.rows.map((row) => String(row.texto))
  } finally {
    await client.end()
  }
}

async function sent(page: Page, settings: string, folder: string, state: string) {
  await sendFolder(page, settings, folder)
  await page.getByText(state, { exact: true }).waitFor()
}

/** 5. Voltar para esta, on Versão 2. */
async function putVersionTwoBack(page: Page, settings: string) {
  await page.goto(settings)
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Versão 2' })
    .getByRole('button', { name: 'Voltar para esta' })
    .click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Voltar para a Versão 2' })
    .click()
  await page.getByText('Versão 2 · no ar').waitFor()
}

test('o roteiro de Recusar um app: não inicia, grava errado, trava, e a versão boa fica', async (t) => {
  const s = await scenario(t)
  const { page } = s.owner
  const pedidos = await pedidosOf(s)
  const settings = `${pedidos.url}/settings`
  // 1. Recados 1 and 2; a recado written on Versão 2.
  await sent(page, settings, 'recados-1', 'Versão 1 · no ar')
  await sent(page, settings, 'recados-2', 'Versão 2 · no ar')
  const written = await openApp(s, pedidos.door, PURPLE)
  const kept = await visitApp(pedidos.door, written, '/api/escreverRecado', { texto: RECADO })
  assert.equal(kept.status, 200)
  // 2. The version that does not start fails, and Abrir app is still Versão 2 with its recado.
  await sent(page, settings, 'recados-nao-inicia', 'Versão 3 · Falhou: O app não inicia.')
  assert.deepEqual(await recados(pedidos.door, await openApp(s, pedidos.door, PURPLE)), [RECADO])
  // 3. The write in `db.query` is on the air and refused; nothing reaches the company's database.
  await sent(page, settings, 'recados-defeito', 'Versão 4 · no ar')
  assert.equal(await page.getByText('Versão 3', { exact: false }).count(), 0)
  const defeito = await openApp(s, pedidos.door, GREEN)
  const refused = await visitApp(pedidos.door, defeito, '/api/escreverRecado', { texto: 'Perdido' })
  assert.equal(refused.status, 500)
  assert.deepEqual(JSON.parse(refused.text), { code: 'HANDLER_FAILED' })
  assert.deepEqual(await recados(pedidos.door, defeito), [RECADO])
  assert.deepEqual(await storedRecados(pedidos.companyDatabase, pedidos.url), [RECADO])
  // 4. Travar: the CPU limit cuts it well before the call's deadline, and the Hub goes on.
  await sent(page, settings, 'recados-laco', 'Versão 5 · no ar')
  const laco = await openApp(s, pedidos.door, GREEN)
  const started = Date.now()
  const cut = await visitApp(pedidos.door, laco, '/api/travar', {})
  assert.equal(cut.status, 502)
  assert.match(cut.text, FAILED_PAGE)
  assert.ok(Date.now() - started < 10_000, `cut after ${Date.now() - started} ms`)
  assert.deepEqual(await recados(pedidos.door, laco), [RECADO])
  await page.goto(pedidos.url)
  await page.getByRole('heading', { name: 'Pedidos', exact: true }).waitFor()
  // 5. Back to Versão 2: Recados works, with its recado.
  await putVersionTwoBack(page, settings)
  assert.deepEqual(await recados(pedidos.door, await openApp(s, pedidos.door, PURPLE)), [RECADO])
  assert.deepEqual(s.problems, [])
})
