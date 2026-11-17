import type { Page } from 'playwright-core'

/**
 * Resolves once the page has stopped moving: no finite animation or transition is running, and the
 * scroll positions and sizes of every scroller held still over two painted frames. It is the event
 * a person waits on (the picture stopped changing), so a test reads layout after it instead of
 * after a guessed number of milliseconds. Endless animations (a spinner) do not count as moving.
 */
export function atRest(page: Page): Promise<void> {
  return page.evaluate(async () => {
    function frame() {
      return new Promise<void>((done) => requestAnimationFrame(() => done()))
    }
    function reading() {
      const scrollers = [...document.querySelectorAll('*')]
        .filter((el) => el.scrollHeight > el.clientHeight || el.scrollTop > 0)
        .map((el) => `${el.scrollTop}/${el.scrollHeight}/${el.clientHeight}`)
      return [...scrollers, `${window.scrollY}/${document.documentElement.scrollHeight}`].join(' ')
    }
    let still = 0
    let last = ''
    while (still < 2) {
      await frame()
      const running = document
        .getAnimations()
        .filter((one) => one.effect?.getComputedTiming().endTime !== Number.POSITIVE_INFINITY)
        .filter((one) => one.playState === 'running' || one.pending)
      if (running.length > 0) {
        await Promise.allSettled(running.map((one) => one.finished))
        still = 0
        continue
      }
      const now = reading()
      still = now === last ? still + 1 : 0
      last = now
    }
  })
}
