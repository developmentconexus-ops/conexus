import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Page } from 'playwright-core'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'

// The diagram of a message, drawn in the drawing frame under the Hub's policy in a real browser
// (security S24, web W22, testing T23).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const HUB = 'https://hub.test'
const DRAWN = { name: 'Diagrama' }

async function open(query: string, viewport = DESKTOP, scheme: 'light' | 'dark' = 'light') {
  const page = await harness.open(`/diagram?${query}`, { viewport, replies: {}, scheme })
  return page
}

/** The addresses the page and its frame ask for from now on, which is where a refused fetch would show. */
function watching(page: Page): string[] {
  const asked: string[] = []
  page.on('request', (request) => asked.push(request.url()))
  return asked
}

async function srcOf(page: Page): Promise<string> {
  const image = page.getByRole('img', DRAWN)
  await image.waitFor({ timeout: 30_000 })
  assert.ok(
    await image.evaluate((each: HTMLImageElement) => each.complete && each.naturalWidth > 0),
    'the picture did not decode',
  )
  return String(await image.getAttribute('src'))
}

test('o diagrama desenhado, nos dois temas e nas duas larguras', async () => {
  for (const viewport of [DESKTOP, PHONE]) {
    for (const scheme of ['light', 'dark'] as const) {
      const page = await open('case=flow', viewport, scheme)
      assert.match(await srcOf(page), /^data:image\/svg\+xml/)
      const box = await page.getByRole('img', DRAWN).boundingBox()
      assert.ok(box && box.width > 40 && box.width <= viewport.width, JSON.stringify(box))
      assert.deepEqual(page.problems, [], `${viewport.width} ${scheme}`)
      await page.close()
    }
  }
})

test('o mermaid inválido mostra o código e uma linha que diz que não foi desenhado', async () => {
  const page = await open('case=bad')
  await page.getByText('Não foi possível desenhar este diagrama.').waitFor({ timeout: 30_000 })
  assert.ok(await page.getByText('flowchart TD').isVisible(), 'the code stays')
  assert.equal(await page.getByRole('img', DRAWN).count(), 0)
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('o diagrama não roda nem busca nada', async () => {
  const page = await open('case=hostile')
  const asked = watching(page)
  await page
    .getByRole('img', DRAWN)
    .or(page.getByText('Não foi possível desenhar este diagrama.'))
    .waitFor({ timeout: 30_000 })
  await page.waitForTimeout(500)
  assert.equal(await page.evaluate(() => Object(window).pwned), undefined, 'no script ran')
  assert.deepEqual(
    asked.filter((url) => !url.startsWith(HUB) && !url.startsWith('data:')),
    [],
    'no request left the page',
  )
  assert.ok(!page.problems.some((each) => /pwned/.test(each)), page.problems.join('\n'))
  await page.close()
})

test('mermaid só é baixado quando o bloco fechado de uma resposta acabada é desenhado', async () => {
  const waiting = await harness.open('/diagram?case=open&streaming', {
    viewport: DESKTOP,
    replies: {},
  })
  const early = watching(waiting)
  await waiting.waitForTimeout(1_500)
  assert.deepEqual(
    early.filter((url) => /diagram-frame|mermaid/.test(url)),
    [],
    'a block still arriving asks for nothing',
  )
  assert.equal(await waiting.getByRole('img', DRAWN).count(), 0)
  await waiting.close()
  const settled = await harness.open('/diagram?case=flow', { viewport: DESKTOP, replies: {} })
  const asked = watching(settled)
  await settled.reload()
  await srcOf(settled)
  assert.ok(
    asked.some((url) => /diagram-frame/.test(url)),
    'the drawn answer asked for the frame',
  )
  await settled.close()
})

test('o diagrama segue o tema: trocar o tema desenha de novo com as cores do outro', async () => {
  const page = await open('case=flow')
  const light = await srcOf(page)
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark'
  })
  await page.waitForFunction(
    (before) => document.querySelector('img[alt=Diagrama]')?.getAttribute('src') !== before,
    light,
    { timeout: 30_000 },
  )
  const dark = await srcOf(page)
  assert.notEqual(dark, light)
  assert.deepEqual(page.problems, [])
  await page.close()
})
