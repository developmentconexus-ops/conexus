import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, DESKTOP } from './layout-harness.ts'

// The contrast of the brand's pairs in a real browser (design V8): the colour each token paints in
// each theme, and the WCAG 2.2 ratio between a text and its ground.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const TEXT = 4.5
const GRAPHIC = 3

/** A text token on a ground token, and the least ratio the pair must reach. */
type Pair = { text: string; ground: string; least: number; inFrame?: true }

function on(grounds: string[], texts: string[], least: number): Pair[] {
  return grounds.flatMap((ground) => texts.map((text) => ({ text, ground, least })))
}

const PAIRS: Pair[] = [
  ...on(['surface', 'surface-3', 'canvas', 'raised', 'surface-4'], ['text', 'text-2'], TEXT),
  ...on(['surface', 'surface-3', 'raised'], ['accent-text'], TEXT),
  // Inside the frame every colour resolves on its dark side, in both themes.
  { text: 'text', ground: 'frame', least: TEXT, inFrame: true },
  { text: 'text-2', ground: 'frame', least: TEXT, inFrame: true },
  ...on(['accent-from', 'accent-to'], ['on-accent'], TEXT),
  { text: 'on-notice', ground: 'notice', least: TEXT },
  { text: 'on-ink', ground: 'ink', least: TEXT },
  { text: 'on-ink', ground: 'danger', least: TEXT },
  // A state's dot and icon, where they are drawn: on the sheet and on what sits on it.
  ...on(['surface', 'raised'], ['success', 'warning', 'danger'], GRAPHIC),
]

function luminance(colour: string): number {
  const channels = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(colour)?.slice(1)
  if (channels?.length !== 3) throw new Error(`not an opaque colour: ${colour}`)
  const [red = 0, green = 0, blue = 0] = channels.map((channel) => {
    const share = Number(channel) / 255
    return share <= 0.04045 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function ratio(text: string, ground: string): number {
  const [lighter, darker] = [luminance(text), luminance(ground)].sort((a, b) => b - a)
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}

test('cada par se lê nos dois temas', async () => {
  const below: string[] = []
  for (const scheme of ['light', 'dark'] as const) {
    const page = await harness.open('/pieces', { viewport: DESKTOP, replies: {}, scheme })
    const painted = await page.evaluate(
      (pairs) =>
        pairs.map((pair) => {
          const ground = document.createElement('div')
          const text = document.createElement('span')
          ground.style.backgroundColor = `var(--color-${pair.ground})`
          // A text utility resolves on its own element, so the frame's text takes its dark side.
          if (pair.inFrame) ground.className = 'scheme-dark'
          if (pair.inFrame) text.className = `text-${pair.text}`
          else text.style.color = `var(--color-${pair.text})`
          ground.append(text)
          document.body.append(ground)
          const colours = [
            getComputedStyle(text).color,
            getComputedStyle(ground).backgroundColor,
          ] as const
          ground.remove()
          return colours
        }),
      PAIRS,
    )
    for (const [at, pair] of PAIRS.entries()) {
      const [text = '', ground = ''] = painted[at] ?? []
      const measured = ratio(text, ground)
      if (measured < pair.least) {
        below.push(
          `${pair.text} on ${pair.ground}, ${scheme}: ${measured.toFixed(2)} < ${pair.least}`,
        )
      }
    }
    await page.close()
  }
  assert.deepEqual(below, [])
})
