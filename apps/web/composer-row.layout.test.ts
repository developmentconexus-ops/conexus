import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listAssistantConnections } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { createHarness, ok, PHONE, SMALL_PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { ASSISTANT_PATH, ASSISTANT_REPLIES } from './sweep-assistant-states.ts'
import { OWNER, startsOn } from './sweep-replies.ts'

const SHEET = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

// The Assistant's box on a phone (the card of 13.3, criterion 16): under 416 px the words go, never the controls.
async function rowOf(page: Page) {
  const names = [
    'Anexar e ferramentas',
    /^\d+ ferramentas?$/,
    /Memória da conversa/,
    'Ditar',
    'Enviar',
  ]
  const found = await Promise.all(
    names.map(async (name) => {
      const box = await page.locator('form').getByRole('button', { name }).first().boundingBox()
      assert.ok(box, `${name} is not laid out`)
      return box
    }),
  )
  return found
}

test('a 390, a linha da caixa do Assistente perde as palavras e guarda todos os controles, na mesma ordem', async () => {
  const page = await harness.open(ASSISTANT_PATH, { viewport: PHONE, replies: ASSISTANT_REPLIES })
  await page
    .locator('form')
    .getByRole('button', { name: /Memória da conversa/ })
    .waitFor()
  const row = await page.locator('form [data-slot="input-group-addon"]').last().boundingBox()
  const boxes = await rowOf(page)
  assert.ok(row, 'the row is not laid out')
  const lefts = boxes.map((box) => box.x)
  assert.deepEqual(
    lefts,
    lefts.toSorted((a, b) => a - b),
    'a control changed side',
  )
  for (const box of boxes) {
    assert.ok(
      box.x >= row.x && box.x + box.width <= row.x + row.width + 1,
      'a control left the row',
    )
  }
  const ring = page.locator('form').getByRole('button', { name: /Memória da conversa/ })
  assert.equal(await ring.getByText('Memória', { exact: true }).isVisible(), false)
  assert.equal(await ring.getByText(/%$/).isVisible(), true)
  assert.equal(
    await page
      .getByRole('button', { name: /^\d+ ferramentas?$/ })
      .first()
      .getByText(/^ ferramenta/)
      .isVisible(),
    false,
  )
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
  await page.close()
})

test('a 390, três arquivos anexados cabem inteiros na caixa, quebrando a fileira', async () => {
  const page = await harness.open(ASSISTANT_PATH, { viewport: PHONE, replies: ASSISTANT_REPLIES })
  await page
    .locator('form')
    .getByRole('button', { name: /Memória da conversa/ })
    .waitFor()
  await page.locator('form input[type="file"]').setInputFiles(
    [
      ['politica-comercial.pdf', 'application/pdf'],
      ['precos-da-tabela-nova.xlsx', SHEET],
      ['contrato-com-o-fornecedor.docx', WORD],
    ].map(([name, mimeType]) => ({ name, mimeType, buffer: Buffer.from('conteudo') })),
  )
  const chips = page
    .getByRole('group', { name: 'Arquivos anexados' })
    .locator('[data-slot="attachment"]')
  await chips.nth(2).waitFor()
  const form = await page.locator('form').first().boundingBox()
  assert.ok(form)
  const boxes = await chips.evaluateAll((nodes) =>
    nodes.map((node) => {
      const { x, y, width, height } = node.getBoundingClientRect()
      return { x, y, width, height }
    }),
  )
  assert.equal(boxes.length, 3)
  for (const box of boxes) {
    assert.ok(box.x >= form.x && box.x + box.width <= form.x + form.width, 'a chip left the box')
  }
  for (const name of [
    'Tirar politica-comercial.pdf',
    'Tirar precos-da-tabela-nova.xlsx',
    'Tirar contrato-com-o-fornecedor.docx',
  ]) {
    const remove = await page.getByRole('button', { name }).boundingBox()
    assert.ok(remove && remove.x + remove.width <= form.x + form.width, `${name} is cut`)
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
  await page.close()
})

test('a 320, o grupo da esquerda ganha uma linha própria e nenhum controle troca de lado', async () => {
  const page = await harness.open(ASSISTANT_PATH, {
    viewport: SMALL_PHONE,
    replies: ASSISTANT_REPLIES,
  })
  await page
    .locator('form')
    .getByRole('button', { name: /Memória da conversa/ })
    .waitFor()
  const [plus, tools, ring, mic, send] = await rowOf(page)
  assert.ok(plus && tools && ring && mic && send)
  assert.ok(plus.y < ring.y && tools.y < ring.y, 'the left group is not on its own line')
  assert.ok(plus.x < tools.x, '+ comes before the tools')
  assert.ok(ring.x < mic.x && mic.x < send.x, 'the right group changed order')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), SMALL_PHONE.width)
  await page.close()
})

test('a 390, o menu da pasta do Início com um Projeto de nome comprido cabe na tela, aberto e depois de escolher', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}`, {
    viewport: PHONE,
    replies: { ...OWNER, ...startsOn(COMPANY.id) },
  })
  await page.getByRole('button', { name: 'Projeto da conversa' }).click()
  const folder = page.getByRole('dialog', { name: 'Projeto da conversa' })
  const option = folder.getByRole('button').nth(1)
  await option.waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
  const menu = await folder.boundingBox()
  assert.ok(menu && menu.x >= 0 && menu.x + menu.width <= PHONE.width, 'the menu left the screen')
  await option.click()
  await folder.waitFor({ state: 'detached' })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
  await page.close()
})

const CONNECTIONS = ['Matriz', 'Filial', 'Loja'].map((name, index) => ({
  connectionId: `${String(index + 1).repeat(8)}-${String(index + 1).repeat(4)}-4${String(index + 1).repeat(3)}-8${String(index + 1).repeat(3)}-${String(index + 1).repeat(12)}`,
  connector: 'sankhya',
  name,
  chosen: true,
}))

// At 390 the tools count yields to the model's name (criterion 16); what "Sem ferramentas" becomes there is the founder's call,
// so that case only proves nothing overlaps and every control stays visible.
const BESIDE: ReadonlyArray<[string, typeof CONNECTIONS]> = [
  ['com a contagem das ferramentas', CONNECTIONS],
  ['com "Sem ferramentas"', []],
]
for (const [name, connections] of BESIDE) {
  test(`a 390, o nome do modelo do Início cabe inteiro ${name}`, async () => {
    const page = await harness.open(`/companies/${COMPANY.id}`, {
      viewport: PHONE,
      replies: {
        ...OWNER,
        ...startsOn(COMPANY.id),
        [`GET /api/companies/${COMPANY.id}/assistant/connections`]: ok(listAssistantConnections, {
          connections,
        }),
      },
    })
    const picker = page.locator('form [aria-label="Modelo e raciocínio"]')
    await picker.waitFor()
    await page
      .locator('form')
      .getByText(/ferramenta|^3/)
      .first()
      .waitFor({ state: 'attached' })
    if (connections.length > 0) {
      const shown = picker.locator('.truncate')
      assert.match(await shown.innerText(), /^\S+ [\d.]+$/, 'the name is not whole')
      assert.ok(
        await shown.evaluate((node) => node.scrollWidth <= node.clientWidth),
        'the model name is cut',
      )
    } else {
      const boxes = await page
        .locator('form [data-slot="input-group-addon"]')
        .last()
        .getByRole('button')
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const { x, width } = node.getBoundingClientRect()
            return { x, width }
          }),
        )
      boxes.sort((a, b) => a.x - b.x)
      for (const [index, box] of boxes.entries()) {
        assert.ok(box.width > 0, 'a control is not visible')
        const next = boxes[index + 1]
        if (next) assert.ok(box.x + box.width <= next.x + 0.5, 'two controls overlap')
      }
    }
    const box = await page.locator('form').first().boundingBox()
    assert.ok(box)
    assert.equal(box.x, 16, 'the box is not 16 px from the edge')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
    await page.close()
  })
}
