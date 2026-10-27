import { MicIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Button } from './button.tsx'

// Copied from AI Elements' `speech-input` (registry read with shadcn 4.22.1, 2026-10-26), painted
// with brand tokens and cut to the browser's recognition: no `MediaRecorder`, no `onAudioRecorded`.
// Added: the phrase in progress and the error code, and the hidden button where there is no
// recognizer. `lib.dom` has the events and the error code but not the recognizer, so it is declared.
declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    addEventListener(type: 'start' | 'end', listener: () => void): void
    addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void
    addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void
  }
  // As `lib.dom` declares its own recognizers: a browser without one lacks the name.
  var SpeechRecognition: (new () => SpeechRecognition) | undefined
  var webkitSpeechRecognition: (new () => SpeechRecognition) | undefined
}

export type DictationError = SpeechRecognitionErrorCode

/** What the event's results from `resultIndex` on say: the words that are final, and the phrase still in progress. */
function heard(event: SpeechRecognitionEvent) {
  let final = ''
  let interim = ''
  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index]
    if (result === undefined) continue
    const transcript = result[0]?.transcript ?? ''
    if (result.isFinal) final += transcript
    else interim += transcript
  }
  return { final, interim }
}

/**
 * The microphone: one tap listens, the next stops, and the words come back as they are heard. It
 * is not drawn where the browser has no `SpeechRecognition`. `processLocally` stays off, so a
 * language pack is not needed on the device.
 */
export function SpeechInput(props: {
  lang: 'pt-BR'
  /** The final text of each result, to join to the box. */
  onFinal: (text: string) => void
  /** The phrase in progress, shown in the box until it is final. */
  onInterim: (text: string) => void
  onError: (error: DictationError) => void
}): ReactNode | null {
  const [Recognition] = useState(
    () => globalThis.SpeechRecognition ?? globalThis.webkitSpeechRecognition,
  )
  const [listening, setListening] = useState(false)
  const [ready, setReady] = useState(false)
  const recognition = useRef<SpeechRecognition | null>(null)
  const { lang, onFinal, onInterim, onError } = props
  const final = useEffectEvent(onFinal)
  const interim = useEffectEvent(onInterim)
  const failed = useEffectEvent(onError)

  useEffect(() => {
    if (Recognition === undefined) return
    const next = new Recognition()
    next.continuous = true
    next.interimResults = true
    next.lang = lang
    next.addEventListener('start', () => setListening(true))
    next.addEventListener('end', () => {
      setListening(false)
      interim('')
    })
    next.addEventListener('result', (event) => {
      const words = heard(event)
      if (words.final !== '') final(words.final)
      interim(words.interim)
    })
    next.addEventListener('error', (event) => {
      if (event.error !== 'aborted') failed(event.error)
    })
    recognition.current = next
    setReady(true)
    return () => {
      next.stop()
      recognition.current = null
      setReady(false)
    }
  }, [Recognition, lang])

  if (Recognition === undefined) return null
  return (
    <Button
      variant="soft"
      size="icon"
      aria-label="Ditar"
      aria-pressed={listening}
      disabled={!ready}
      className="aria-pressed:text-danger"
      onClick={() => (listening ? recognition.current?.stop() : recognition.current?.start())}
    >
      <MicIcon aria-hidden="true" />
    </Button>
  )
}
