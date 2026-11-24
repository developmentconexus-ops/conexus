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
  constructor() {
    super()
    Recognizer.made.push(this)
  }
  start() {
    this.dispatchEvent(new Event('start'))
  }
  stop() {
    this.stops += 1
    this.fail('aborted')
  }
  hear(...phrases: { text: string; final: boolean }[]) {
    const results = phrases.map((phrase) =>
      Object.assign([{ transcript: phrase.text, confidence: 1 }], { isFinal: phrase.final }),
    )
    this.dispatchEvent(Object.assign(new Event('result'), { resultIndex: 0, results }))
  }
  fail(error: SpeechRecognitionErrorCode) {
    this.dispatchEvent(Object.assign(new Event('error'), { error, message: '' }))
    this.dispatchEvent(new Event('end'))
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
  expect(mic.getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(mic)
  expect(recognizer().stops).toBe(1)
  expect(screen.queryByRole('alert')).toBeNull()
  expect(mic.getAttribute('aria-pressed')).toBe('false')
})

test('a frase em andamento não entra no rascunho: a caixa só lê até ela virar final, e ela é juntada uma vez', async () => {
  const { field, mic, recognizer } = await dictate()
  fireEvent.change(field, { target: { value: 'Monte um app' } })
  fireEvent.click(mic)
  act(() => recognizer().hear({ text: 'acrescente o tele', final: false }))
  expect(field.hasAttribute('readonly')).toBe(true)
  act(() => recognizer().hear({ text: 'acrescente o telefone', final: true }))
  expect(field.hasAttribute('readonly')).toBe(false)
  expect(typed(field)).toBe('Monte um app acrescente o telefone')
})

const ZIP = new File(['x'], 'pacote.zip', { type: 'application/zip' })
const REFUSED = 'Este tipo de arquivo não é aceito.'
const DENIED = 'Permita o microfone no navegador para ditar.'

test('uma frase só acima da caixa: a do que aconteceu por último, do arquivo recusado ou do microfone', async () => {
  const { field, mic, recognizer } = await dictate()
  fireEvent.click(mic)
  act(() => recognizer().fail('not-allowed'))
  expect((await screen.findByRole('alert')).textContent).toBe(DENIED)
  fireEvent.paste(field, { clipboardData: { files: [ZIP] } })
  expect((await screen.findByRole('alert')).textContent).toBe(REFUSED)
  fireEvent.click(mic)
  act(() => recognizer().fail('no-speech'))
  expect((await screen.findByRole('alert')).textContent).toBe('Não ouvimos nada. Tente de novo.')
  fireEvent.paste(field, { clipboardData: { files: [ZIP] } })
  expect((await screen.findByRole('alert')).textContent).toBe(REFUSED)
  fireEvent.click(mic)
  act(() => recognizer().fail('not-allowed'))
  act(() => recognizer().hear({ text: 'oi', final: true }))
  expect(screen.queryByRole('alert')).toBeNull()
})

test('sem reconhecimento não há microfone', async () => {
  await openConversation(conversationOf({ id: ConversationId.parse(crypto.randomUUID()) }))
  expect(screen.queryByRole('button', { name: 'Ditar' })).toBeNull()
})
