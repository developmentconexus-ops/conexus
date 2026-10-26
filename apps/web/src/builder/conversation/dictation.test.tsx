import { ConversationId } from '@conexus/hub-api'
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { conversationOf, screens, typed } from './test-hub.tsx'

const { openConversation } = screens(hubServer())

/** The browser's recognizer, standing in: it records how it was set and lets the test speak and fail for it. */
class Recognizer extends EventTarget {
  static made: Recognizer[] = []
  continuous = false
  interimResults = false
  lang = ''
  stops = 0
  starts = 0
  onresult: ((event: { resultIndex: number; results: unknown[] }) => void) | null = null
  onerror: ((event: { error: SpeechRecognitionErrorCode }) => void) | null = null
  onend: (() => void) | null = null
  constructor() {
    super()
    Recognizer.made.push(this)
  }
  start() {
    this.starts += 1
  }
  stop() {
    this.stops += 1
    this.onend?.()
  }
  hear(...phrases: { text: string; final: boolean }[]) {
    const results = phrases.map((phrase) =>
      Object.assign([{ transcript: phrase.text, confidence: 1 }], { isFinal: phrase.final }),
    )
    this.onresult?.({ resultIndex: 0, results })
  }
  fail(error: SpeechRecognitionErrorCode) {
    this.onerror?.({ error })
    this.onend?.()
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  Recognizer.made = []
  sessionStorage.clear()
})

async function dictate() {
  vi.stubGlobal('SpeechRecognition', Recognizer)
  const opened = await openConversation(
    conversationOf({ id: ConversationId.parse(crypto.randomUUID()) }),
  )
  const mic = screen.getByRole('button', { name: 'Ditar' })
  function recognizer() {
    const made = Recognizer.made.at(-1)
    if (made === undefined) throw new Error('the microphone was not tapped')
    return made
  }
  return { ...opened, mic, recognizer }
}

test('o microfone escreve em português na caixa, com a frase em andamento à vista, e para no segundo toque', async () => {
  const { field, mic, recognizer } = await dictate()
  fireEvent.change(field, { target: { value: 'Monte um app' } })
  expect(mic.getAttribute('aria-pressed')).toBe('false')
  fireEvent.click(mic)
  expect(mic.getAttribute('aria-pressed')).toBe('true')
  expect(recognizer()).toMatchObject({ lang: 'pt-BR', continuous: true, interimResults: true })
  act(() => recognizer().hear({ text: 'acrescente o tele', final: false }))
  expect(typed(field)).toBe('Monte um app acrescente o tele')
  act(() => recognizer().hear({ text: 'acrescente o telefone', final: true }))
  expect(typed(field)).toBe('Monte um app acrescente o telefone')
  act(() => recognizer().hear({ text: ' do cliente', final: false }))
  expect(typed(field)).toBe('Monte um app acrescente o telefone do cliente')
  fireEvent.click(mic)
  expect(recognizer().stops).toBe(1)
  expect(mic.getAttribute('aria-pressed')).toBe('false')
  expect(typed(field)).toBe('Monte um app acrescente o telefone')
})

test('cada erro tem sua frase', async () => {
  const { mic, recognizer } = await dictate()
  const phrases: [SpeechRecognitionErrorCode, string][] = [
    ['not-allowed', 'Permita o microfone no navegador para ditar.'],
    ['service-not-allowed', 'Permita o microfone no navegador para ditar.'],
    ['language-not-supported', 'Este navegador não dita em português.'],
    ['no-speech', 'Não ouvimos nada. Tente de novo.'],
    ['network', 'O ditado parou. Tente de novo.'],
  ]
  for (const [error, phrase] of phrases) {
    fireEvent.click(mic)
    act(() => recognizer().fail(error))
    expect((await screen.findByRole('alert')).textContent).toBe(phrase)
    expect(mic.getAttribute('aria-pressed')).toBe('false')
    act(() => recognizer().hear({ text: 'oi', final: true }))
    expect(screen.queryByRole('alert')).toBeNull()
  }
})

test('o segundo toque para sem frase', async () => {
  const { mic, recognizer } = await dictate()
  fireEvent.click(mic)
  act(() => recognizer().fail('aborted'))
  expect(screen.queryByRole('alert')).toBeNull()
  expect(mic.getAttribute('aria-pressed')).toBe('false')
})

test('sem reconhecimento não há microfone', async () => {
  await openConversation(conversationOf({ id: ConversationId.parse(crypto.randomUUID()) }))
  expect(screen.queryByRole('button', { name: 'Ditar' })).toBeNull()
})
