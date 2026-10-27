import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from './message-scroller.tsx'

/** A viewport of 100px over 300px of text, resting at `scrollTop`, that records where it is sent. */
function viewportAt(scrollTop: number) {
  render(
    <MessageScrollerProvider>
      <MessageScroller>
        <MessageScrollerViewport aria-label="Rolagem">
          <MessageScrollerContent>Oi</MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>
    </MessageScrollerProvider>,
  )
  const viewport = screen.getByLabelText('Rolagem')
  let top = scrollTop
  const sent: number[] = []
  Object.defineProperties(viewport, {
    scrollTo: {
      value: (options: ScrollToOptions) => {
        sent.push(options.top ?? Number.NaN)
      },
    },
    scrollHeight: { value: 300 },
    clientHeight: { value: 100 },
    scrollTop: {
      get: () => top,
      set: (to: number) => {
        sent.push(to)
        top = to
      },
    },
  })
  return { viewport, sent }
}

test('soltar o dedo puxado para além do fim deixa o balanço do iPhone terminar, sem rolar o texto', () => {
  const { viewport, sent } = viewportAt(230)
  fireEvent.touchEnd(viewport)
  expect(sent).toEqual([])
})

test('soltar o dedo no fim, sem puxar além, continua seguindo o fim', () => {
  const { viewport, sent } = viewportAt(200)
  fireEvent.touchEnd(viewport)
  expect(sent).toEqual([200])
})
