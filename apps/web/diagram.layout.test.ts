import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Frame, Page, Request } from 'playwright-core'
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

/** The picture's size in the SVG's own units, from the `viewBox` the library draws. */
function viewBoxWidth(src: string): number {
  const svg = decodeURIComponent(src.slice(src.indexOf(',') + 1))
  const box = /viewBox="[\d.-]+ [\d.-]+ ([\d.]+) [\d.]+"/.exec(svg)
  assert.ok(box?.[1], 'the drawn SVG has no viewBox')
  return Number(box[1])
}

test('o diagrama tem o tamanho do desenho, ou a largura do bloco com rolagem lateral quando é mais largo', async () => {
  for (const viewport of [DESKTOP, PHONE]) {
    for (const drawing of ['flow', 'wide']) {
      const page = await open(`case=${drawing}`, viewport)
      const wanted = viewBoxWidth(await srcOf(page))
      const seen = await page.getByRole('img', DRAWN).evaluate((image: HTMLImageElement) => {
        const holder = image.parentElement
        const column = document.getElementById('column')
        return {
          image: image.getBoundingClientRect().width,
          holder: holder?.getBoundingClientRect().width ?? 0,
          scrolls: holder ? holder.scrollWidth > holder.clientWidth : false,
          column: column?.getBoundingClientRect().width ?? 0,
          frame: holder
            ? holder.getBoundingClientRect().width -
              holder.clientWidth +
              parseFloat(getComputedStyle(holder).paddingLeft) * 2
            : 0,
        }
      })
      const label = `${drawing} ${viewport.width} ${JSON.stringify({ wanted, ...seen })}`
      assert.ok(seen.holder >= Math.min(wanted, seen.column) - 2, `the block is narrower: ${label}`)
      if (wanted + seen.frame <= seen.column) {
        assert.ok(Math.abs(seen.image - wanted) <= 1, `the picture is not drawn size: ${label}`)
        assert.equal(seen.scrolls, false, label)
      } else {
        assert.ok(seen.image >= wanted - 1, `the wide picture was shrunk: ${label}`)
        assert.ok(seen.scrolls, `the block does not scroll: ${label}`)
      }
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

function refusal(url: string): string {
  return `Loading the image '${url}' violates the following Content Security Policy directive: "img-src data:". The action has been blocked.`
}

/** The requests that go outside the Hub from now on, kept to say how each one ended. */
function outsideOf(page: Page) {
  const asked: Request[] = []
  page.on('request', (request) => {
    if (!request.url().startsWith(HUB) && !request.url().startsWith('data:')) asked.push(request)
  })
  return asked
}

function drawingFrame(page: Page): Frame {
  const frame = page.frames().find((each) => each.url().endsWith('/diagram-frame.html'))
  assert.ok(frame, 'the page has no drawing frame')
  return frame
}

test('o diagrama não roda nem busca nada: o HTML, o @import e o url() de fora', async () => {
  const page = await open('case=hostile')
  const asked = outsideOf(page)
  await srcOf(page)
  await page.waitForTimeout(500)
  assert.equal(await page.evaluate(() => Object(window).pwned), undefined, 'no script in the page')
  assert.equal(
    await drawingFrame(page).evaluate(() => Object(window).pwned),
    undefined,
    'no script in the frame',
  )
  assert.equal(await page.locator('svg, [onerror], script:not([src])').count(), 0)
  assert.deepEqual(page.problems, [refusal('https://evil.test/b.png')], 'only the refusals listed')
  assert.ok(asked.length > 0, 'the fetch was tried')
  for (const request of asked) {
    assert.equal(request.failure()?.errorText, 'csp', request.url())
  }
  await page.close()
})

test('um nó de imagem de fora deixa o bloco como código, e a política recusa a busca', async () => {
  const page = await open('case=image')
  const asked = outsideOf(page)
  await page.getByText('Não foi possível desenhar este diagrama.').waitFor({ timeout: 30_000 })
  assert.equal(await page.getByRole('img', DRAWN).count(), 0)
  assert.deepEqual(page.problems, [refusal('https://evil.test/a.png')], 'only the refusal listed')
  assert.ok(asked.length > 0, 'the fetch was tried')
  for (const request of asked) {
    assert.equal(request.failure()?.errorText, 'csp', request.url())
  }
  await page.close()
})

test('o quadro tem origem opaca: não lê o documento da página que o emoldura', async () => {
  const page = await open('case=flow')
  await srcOf(page)
  assert.equal(await page.locator('iframe').getAttribute('sandbox'), 'allow-scripts')
  const seen = await drawingFrame(page).evaluate(() => {
    let read: string
    try {
      read = typeof parent.document.body
    } catch (error) {
      read = String(Object(error).name)
    }
    return { origin: window.origin, read }
  })
  assert.deepEqual(seen, { origin: 'null', read: 'SecurityError' })
  await page.close()
})

function requestOf(id: number) {
  return { id, code: 'flowchart TD\n  A --> B', themeVariables: {} }
}

const FORGED =
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect id="forged"/></svg>'

test('uma mensagem forjada de outra janela à página é recusada', async () => {
  const page = await open('case=flow&hold')
  const released = Promise.withResolvers<void>()
  await page.route(`${HUB}/diagram-frame.html`, async (route) => {
    await released.promise
    await route.fallback()
  })
  await page.evaluate(() => Object(window).showAnswer())
  await page.evaluate((svg) => {
    window.postMessage({ ready: true }, '*')
    window.postMessage({ id: 0, ok: true, svg }, '*')
  }, FORGED)
  await page.waitForTimeout(500)
  assert.equal(await page.getByRole('img', DRAWN).count(), 0, 'the forged picture was drawn')
  assert.ok(await page.getByText('flowchart TD').isVisible(), 'the code stays')
  released.resolve()
  assert.doesNotMatch(await srcOf(page), /id%3D%22forged/)
  await page.close()
})

test('uma mensagem forjada de outra janela ao quadro não tem resposta', async () => {
  const page = await open('case=flow')
  await srcOf(page)
  await page.evaluate(() => {
    const heard: unknown[] = []
    Object.assign(window, { heard })
    window.addEventListener('message', (event) => heard.push(event.data))
  })
  await page.evaluate(() => {
    document.body.append(document.createElement('iframe'))
  })
  const other = page
    .frames()
    .find((each) => each !== page.mainFrame() && each.url() === 'about:blank')
  assert.ok(other, 'the other window is missing')
  // Run in the other window's own realm, so the message's source is that window, not the page.
  function send(message: object) {
    return other?.evaluate(
      (sent) =>
        parent.document
          .querySelector<HTMLIFrameElement>('iframe[sandbox]')
          ?.contentWindow?.postMessage(sent, '*'),
      message,
    )
  }
  await send(requestOf(99))
  await page.evaluate((own) => {
    document
      .querySelector<HTMLIFrameElement>('iframe[sandbox]')
      ?.contentWindow?.postMessage(own, '*')
  }, requestOf(98))
  await page.waitForFunction(
    () => Object(window).heard.some((each: unknown) => Object(each).id === 98),
    undefined,
    { timeout: 30_000 },
  )
  await page.waitForTimeout(500)
  const ids = await page.evaluate(() =>
    Object(window).heard.map((each: unknown) => Object(each).id),
  )
  assert.ok(ids.includes(98), "the page itself, the frame's parent, is answered")
  assert.ok(!ids.includes(99), 'a message from another window is answered')
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
