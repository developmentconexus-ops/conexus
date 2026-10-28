import assert from 'node:assert/strict'
import { test } from 'node:test'
import { appLogin, ProjectId } from '@conexus/hub-api'
import pg from 'pg'
import type { Page } from 'playwright-core'
import type { DatabaseUrl } from '../../apps/server/src/platform/database.ts'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import { visitApp } from './apps-edge.ts'
import type { Scenario } from './apps-journey.ts'
import {
  builderSends,
  GREEN,
  openApp,
  PURPLE,
  pedidosOf,
  RECADO,
  recados,
  scenario,
} from './apps-journey.ts'
import {
  ANA,
  chooseDefaultModel,
  KEYS,
  plantJourney,
  plantTwoCompanies,
  publicPage,
} from './conversation-journey.ts'
import { hubWindow, openConversation } from './hub-window.ts'
import { createProject, liveHub, PASSWORD, signIn, waitForHome } from './live-hub.ts'
import { enter, linkKey } from './model-accounts-journey.ts'

// Step 10's journey, with the Builder as the one who sends since step 14.1: Ana's Builder turns
// send a version that does not start, one that writes in `db.query` and one whose Travar never
// ends, and Pedidos's Versões show the version on the air, its data and the Hub stay as they were.
// Cloudflare's API and its namespace are doubles: the API runs a script's top level on upload and
// the namespace cuts a Worker past its CPU, as record 0047 saw; the app's `db` runs on the test
// server with the login the Hub made (testing T5, T6, T14).

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

async function sent(s: Scenario, pedidos: string, folder: string, state: string) {
  await builderSends(s, pedidos, folder)
  await s.owner.page.goto(`${pedidos}?lens=project&section=versions`)
  await s.owner.page.getByText(state, { exact: true }).waitFor()
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
  const settings = `${pedidos.url}?lens=project&section=versions`
  // 1. Recados 1 and 2; a recado written on Versão 2.
  await sent(s, pedidos.url, 'recados-1', 'Versão 1 · no ar')
  await sent(s, pedidos.url, 'recados-2', 'Versão 2 · no ar')
  const written = await openApp(s, pedidos.door, PURPLE)
  const kept = await visitApp(pedidos.door, written, '/api/escreverRecado', { texto: RECADO })
  assert.equal(kept.status, 200)
  // 2. The version that does not start fails, and Abrir app is still Versão 2 with its recado.
  await sent(s, pedidos.url, 'recados-nao-inicia', 'Versão 3 · Falhou: O app não inicia.')
  assert.deepEqual(await recados(pedidos.door, await openApp(s, pedidos.door, PURPLE)), [RECADO])
  // 3. The write in `db.query` is on the air and refused; nothing reaches the company's database.
  await sent(s, pedidos.url, 'recados-defeito', 'Versão 4 · no ar')
  assert.equal(await page.getByText('Versão 3', { exact: false }).count(), 0)
  const defeito = await openApp(s, pedidos.door, GREEN)
  const refused = await visitApp(pedidos.door, defeito, '/api/escreverRecado', { texto: 'Perdido' })
  assert.equal(refused.status, 500)
  assert.deepEqual(JSON.parse(refused.text), { code: 'HANDLER_FAILED' })
  assert.deepEqual(await recados(pedidos.door, defeito), [RECADO])
  assert.deepEqual(await storedRecados(pedidos.companyDatabase, pedidos.url), [RECADO])
  // 4. Travar: the CPU limit cuts it well before the call's deadline, and the Hub goes on.
  await sent(s, pedidos.url, 'recados-laco', 'Versão 5 · no ar')
  const laco = await openApp(s, pedidos.door, GREEN)
  const started = Date.now()
  const cut = await visitApp(pedidos.door, laco, '/api/travar', {})
  assert.equal(cut.status, 502)
  assert.match(cut.text, FAILED_PAGE)
  assert.ok(Date.now() - started < 10_000, `cut after ${Date.now() - started} ms`)
  assert.deepEqual(await recados(pedidos.door, laco), [RECADO])
  await page.goto(`${pedidos.url}?lens=project`)
  await page.getByTestId('area').getByRole('heading', { name: 'Pedidos', exact: true }).waitFor()
  // 5. Back to Versão 2: Recados works, with its recado.
  await putVersionTwoBack(page, settings)
  assert.deepEqual(await recados(pedidos.door, await openApp(s, pedidos.door, PURPLE)), [RECADO])
  assert.deepEqual(s.problems, [])
})

test('o roteiro da sessão que termina: a conversa aberta, a volta à aba, um Entrar e a conversa de novo', async (t) => {
  plantJourney(t, await publicPage(t))
  const { port, database } = await liveHub(t, 'http://127.0.0.1:9/unused')
  const ids = await plantTwoCompanies(database)
  const problems: string[] = []
  const closers: (() => Promise<void>)[] = []
  try {
    const page = await hubWindow(closers, port, '198.51.100.10', problems)
    await enter(page, ANA.email, `/companies/${ids.companyA}/settings/model-accounts`)
    await linkKey(page, 'Time 1', KEYS.first)
    await page.getByText('Time 1', { exact: true }).first().waitFor()
    await chooseDefaultModel(page, ids.companyA)
    await page.goto(`${TEST_ORIGIN}/companies/${ids.companyA}`)
    await waitForHome(page)
    await createProject(page, 'Encomendas')
    await page.getByRole('heading', { name: 'Encomendas', exact: true }).waitFor()
    await openConversation(page, () => page.getByRole('button', { name: 'Nova conversa' }).click())
    const conversation = new URL(page.url())
    // The session ends on the server; the tab comes back to the front and every open read gets a 401.
    await database.asOwner('delete from auth.session')
    await page.evaluate(() =>
      document.dispatchEvent(new Event('visibilitychange', { bubbles: true })),
    )
    await page.getByText('Sua sessão terminou. Entre de novo para continuar.').waitFor()
    await signIn(page, ANA.email, PASSWORD)
    await page.waitForURL((url) => url.pathname === conversation.pathname)
    assert.equal(new URL(page.url()).pathname, conversation.pathname)
  } finally {
    for (const close of closers) await close()
  }
})
