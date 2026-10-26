import { MicIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Button } from './button.tsx'

// Copied from AI Elements' `speech-input` (registry read with shadcn 4.22.1, 2026-10-26), painted
// with brand tokens and cut to the browser's recognition: no `MediaRecorder`, no `onAudioRecorded`.
// `lib.dom` has the events and the error code but not the recognizer, so it is declared here.
declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
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
  const [listening, setListening] = useState(false)
  const recognition = useRef<SpeechRecognition | null>(null)
  const latest = useRef(props)
  latest.current = props

  useEffect(
    () => () => {
      recognition.current?.stop()
    },
    [],
  )

  const Recognition = globalThis.SpeechRecognition ?? globalThis.webkitSpeechRecognition
  if (Recognition === undefined) return null

  function listen(Recognition: new () => SpeechRecognition) {
    const next = new Recognition()
    next.continuous = true
    next.interimResults = true
    next.lang = latest.current.lang
    next.onresult = (event) => {
      const { final, interim } = heard(event)
      if (final !== '') latest.current.onFinal(final)
      latest.current.onInterim(interim)
    }
    next.onerror = (event) => {
      if (event.error !== 'aborted') latest.current.onError(event.error)
    }
    next.onend = () => {
      recognition.current = null
      setListening(false)
      latest.current.onInterim('')
    }
    recognition.current = next
    setListening(true)
    next.start()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Ditar"
      aria-pressed={listening}
      className="aria-pressed:bg-surface-3 aria-pressed:text-danger"
      onClick={() =>
        recognition.current === null ? listen(Recognition) : recognition.current.stop()
      }
    >
      <MicIcon aria-hidden="true" />
    </Button>
  )
}
