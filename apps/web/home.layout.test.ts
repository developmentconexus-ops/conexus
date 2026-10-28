import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import {
  BUILDER_CONTROLLER,
  BUILDER_ROUTES,
  createConversation,
  createProject,
  listModelAccounts,
  readConversation,
} from '@conexus/hub-api'
import type { Locator, Page } from 'playwright-core'
import type { Replies, Viewport } from './layout-harness.ts'
import { createHarness, DESKTOP, ok, PHONE, ZOOMED_PHONE } from './layout-harness.ts'
import { HANDOFF_UNCONFIRMED } from './src/builder/conversation/text.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import {
  companies,
  OWNER,
  PROJECT_ID,
  PROJECT_NAME,
  projectsPage,
  startsOn,
} from './sweep-replies.ts'
import { sessionReplies } from './sweep-session.ts'

// Início in a real browser: one company Ana owns, its Início in the company's frame.
const HOUSE = companies([{ name: 'Empresa Teste', role: 'owner' }], false)
const COMPANY_ID = '0'.repeat(32)

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function open(path: string, viewport: Viewport, replies: Replies) {
  return harness.open(path, { viewport, replies })
}

/** The centre of what an element draws, its text or its children, not of its own block's box. */
async function centreOf(locator: Locator): Promise<number> {
  const [left, right] = await locator.evaluate((element) => {
    const drawn = document.createRange()
    drawn.selectNodeContents(element)
    const rects = [...drawn.getClientRects()].filter((rect) => rect.width > 0)
    return [
      Math.min(...rects.map((rect) => rect.left)),
      Math.max(...rects.map((rect) => rect.right)),
    ]
  })
  assert.ok(Number.isFinite(left) && Number.isFinite(right), 'the element draws nothing')
  return (left + right) / 2
}

const SONNET = 'anthropic/claude-sonnet-4'
// Início opens its box only for a person with a model to start on.
const WITH_MODEL: Replies = {
  ...HOUSE,
  [`GET /api/companies/${COMPANY_ID}/model-accounts`]: ok(listModelAccounts, {
    company: [],
    mine: [],
    order: [],
    kinds: [],
    defaults: {
      company: null,
      mine: null,
      start: { model: SONNET, effort: 'off', from: 'company', account: 'Claude da empresa' },
      companyStart: null,
    },
    choices: {
      mine: [{ id: 'anthropic', name: 'Anthropic', models: [{ id: SONNET, efforts: ['off'] }] }],
      company: [],
    },
    fallback: { enabled: false, chain: [], revision: 0 },
    usableProviders: ['anthropic'],
    mayManage: false,
  }),
}

for (const viewport of [DESKTOP, PHONE]) {
  test(`o Início é centrado: título, caixa e exemplos no centro da coluna, numa tela de ${viewport.width}px`, async () => {
    const page = await open(`/companies/${COMPANY_ID}`, viewport, WITH_MODEL)
    const title = page.getByRole('heading', { name: 'O que vamos construir?' })
    const box = page
      .getByRole('textbox', { name: 'Mensagem para o Builder' })
      .locator('xpath=ancestor::form')
    const examples = page.getByRole('list', { name: 'Exemplos' })
    await examples.waitFor()
    // The page's column, `max-w-page` at the start of `main`, is the title's section.
    const section = await title.locator('xpath=ancestor::section[1]').boundingBox()
    assert.ok(section, 'the section is not laid out')
    const column = section.x + section.width / 2
    for (const [name, one] of [
      ['título', title],
      ['caixa', box],
      ['exemplos', examples],
    ] as const) {
      assert.ok(Math.abs((await centreOf(one)) - column) <= 1, `${name} is off the column's centre`)
    }
    assert.ok(((await box.boundingBox())?.width ?? Infinity) <= 736, 'the box is wider than 46rem')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width)
    await page.close()
  })
}

const CONVERSATION_ID = '33333333-3333-4333-8333-333333333333'
const PROJECT_API = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const MESSAGES = `${BUILDER_ROUTES}/agent-controller/${BUILDER_CONTROLLER}/sessions/${CONVERSATION_ID}/messages`
const REQUEST = 'Um app de encomendas com cliente, data de entrega e valor'
const CREATED_AT = '2026-10-27T12:00:00.000Z'

/** Início creates the Projeto and its conversation, which opens and sends; `sent` holds that send. */
function starting(sent: Promise<unknown>): Replies {
  return {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    ...startsOn(COMPANY.id),
    [`POST /api/companies/${COMPANY.id}/projects`]: ok(createProject, {
      project: {
        id: PROJECT_ID,
        name: PROJECT_NAME,
        createdAt: CREATED_AT,
        mayDelete: true,
        address: 'pedidos--empresa-teste.apps.example.test',
        appVersion: null,
        publishedVersion: null,
      },
    }),
    [`POST ${PROJECT_API}/conversations`]: ok(createConversation, {
      conversation: {
        id: CONVERSATION_ID,
        title: null,
        createdAt: CREATED_AT,
        model: 'anthropic/claude-sonnet-4',
      },
    }),
    [`GET ${PROJECT_API}/conversations/${CONVERSATION_ID}`]: ok(readConversation, {
      conversation: { id: CONVERSATION_ID, title: null, createdAt: CREATED_AT },
    }),
    ...sessionReplies(CONVERSATION_ID, {}),
    [`POST ${MESSAGES}`]: { status: 200, json: { ok: true }, hold: sent },
  }
}

/** The request written, **Enviar**, the name, **Criar e começar**: the conversation opens. */
async function start(page: Page) {
  await page.getByRole('textbox', { name: 'Mensagem para o Builder' }).fill(REQUEST)
  await page.getByRole('button', { name: 'Enviar' }).click()
  await page.getByLabel('Nome do projeto').fill('Pedidos')
  await page.getByRole('button', { name: 'Criar e começar' }).click()
  await page.waitForURL((url) => url.pathname.endsWith(`/conversations/${CONVERSATION_ID}`))
}

function messagesSent(page: Page & { seen: { method: string; path: string }[] }) {
  return page.seen.filter((one) => one.method === 'POST' && one.path === MESSAGES).length
}

test('no celular, Criar e começar abre na Conversa, não na Prévia', async () => {
  const page = await open(`/companies/${COMPANY.id}`, PHONE, starting(Promise.resolve()))
  await start(page)
  const conversation = page.getByRole('button', { name: 'Conversa', exact: true })
  assert.equal(await conversation.getAttribute('aria-pressed'), 'true')
  assert.ok(await page.getByRole('log', { name: 'Conversa com o Builder' }).isVisible())
  assert.equal(await page.getByText(/Ainda não há uma prévia/).isVisible(), false)
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('recarregar durante o envio do pedido põe o texto na caixa com a frase e não reenvia (11)', async () => {
  const held = Promise.withResolvers<void>()
  const page = await open(`/companies/${COMPANY.id}`, DESKTOP, starting(held.promise))
  await start(page)
  await page.waitForFunction(
    (key) => sessionStorage.getItem(key) !== null,
    `conexus-handoff:${CONVERSATION_ID}`,
  )
  assert.equal(messagesSent(page), 1)
  await page.reload()
  assert.equal(await page.getByRole('alert').textContent(), HANDOFF_UNCONFIRMED)
  const field = page.getByRole('textbox', { name: 'Mensagem para o Builder' })
  assert.equal(await field.inputValue(), REQUEST)
  assert.equal(messagesSent(page), 1)
  held.resolve()
  await page.close()
})

test('o pedido recusado e reenviado não volta depois de recarregar: sem a frase do envio cortado, a caixa vazia, e no celular em App', async () => {
  for (const viewport of [DESKTOP, PHONE]) {
    const replies = {
      ...starting(Promise.resolve()),
      [`POST ${MESSAGES}`]: { status: 502, json: {} },
    }
    const page = await open(`/companies/${COMPANY.id}`, viewport, replies)
    await start(page)
    await page.getByRole('alert').waitFor()
    replies[`POST ${MESSAGES}`] = { status: 200, json: { ok: true } }
    await page.getByRole('button', { name: 'Enviar' }).click()
    await page.waitForFunction(() => document.querySelector('[role=alert]') === null)
    await page.reload()
    const field = page.getByRole('textbox', { name: 'Mensagem para o Builder' })
    if (viewport === PHONE) {
      const app = page.getByRole('button', { name: 'App', exact: true })
      await app.waitFor()
      assert.equal(await app.getAttribute('aria-pressed'), 'true')
      await page.getByRole('button', { name: 'Conversa', exact: true }).click()
    }
    await field.waitFor()
    assert.equal(await page.getByRole('alert').count(), 0)
    assert.equal(await field.inputValue(), '')
    await page.close()
  }
})

test('no celular, recarregar durante o envio do pedido abre na Conversa, com a frase à vista', async () => {
  const held = Promise.withResolvers<void>()
  const page = await open(`/companies/${COMPANY.id}`, PHONE, starting(held.promise))
  await start(page)
  await page.waitForFunction(
    (key) => sessionStorage.getItem(key) !== null,
    `conexus-handoff:${CONVERSATION_ID}`,
  )
  await page.reload()
  const conversation = page.getByRole('button', { name: 'Conversa', exact: true })
  assert.equal(await conversation.getAttribute('aria-pressed'), 'true')
  assert.equal(await page.getByRole('alert').textContent(), HANDOFF_UNCONFIRMED)
  assert.ok(await page.getByRole('alert').isVisible())
  assert.equal(await page.getByText(/Ainda não há uma prévia/).isVisible(), false)
  held.resolve()
  await page.close()
})

test('sem conta de modelo, o botão Minhas contas de modelo tem 32 px a 390 px e quebra a linha a 200%', async () => {
  const replies: Replies = {
    ...WITH_MODEL,
    [`GET /api/companies/${COMPANY_ID}/model-accounts`]: ok(listModelAccounts, {
      company: [],
      mine: [],
      order: [],
      kinds: [],
      defaults: { company: null, mine: null, start: null, companyStart: null },
      choices: { mine: [], company: [] },
      fallback: { enabled: false, chain: [], revision: 0 },
      usableProviders: [],
      mayManage: false,
    }),
  }
  const page = await open(`/companies/${COMPANY_ID}`, PHONE, replies)
  const link = page.getByRole('link', { name: 'Minhas contas de modelo' })
  await link.waitFor()
  const box = await link.boundingBox()
  assert.equal(box?.height, 32)
  await page.close()
  const zoomed = await open(`/companies/${COMPANY_ID}`, ZOOMED_PHONE, replies)
  const wrapped = await zoomed.getByRole('link', { name: 'Minhas contas de modelo' }).boundingBox()
  assert.ok((wrapped?.height ?? 0) > 32, 'the label stays on one line at 200%')
  assert.equal(
    await zoomed.evaluate(() => document.documentElement.scrollWidth),
    ZOOMED_PHONE.width,
  )
  await zoomed.close()
})
