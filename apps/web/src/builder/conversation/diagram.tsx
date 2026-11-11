import { DIAGRAM_FRAME } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useTheme } from '../../platform/theme.ts'

/** What a mermaid block became: being drawn, drawn as an image, or left as its code. */
type Drawn = { kind: 'DRAWING' } | { kind: 'DRAWN'; src: string } | { kind: 'NOT_DRAWN' }

/** The frame answers in this long at the most; past it the block stays code. */
const DRAW_TIMEOUT_MS = 20_000

type Reply = { id: number; ok: boolean; svg?: string }

// The tokens are `light-dark(…)`, which the library does not read, so each colour is the computed
// one of a probe element that wears the token's own classes (no colour value in the code, V3).
const PROBES = {
  background: 'bg-surface',
  primaryColor: 'bg-surface-3',
  secondaryColor: 'bg-surface-4',
  tertiaryColor: 'bg-surface',
  primaryTextColor: 'text-text',
  lineColor: 'text-text-2',
  primaryBorderColor: 'border-line-strong',
} as const

function themeVariables(): Record<string, string> {
  const probe = document.createElement('span')
  probe.className = 'border absolute'
  document.body.append(probe)
  try {
    return Object.fromEntries(
      Object.entries(PROBES).map(([name, token]) => {
        probe.className = `absolute border ${token}`
        const style = getComputedStyle(probe)
        const colour = token.startsWith('bg-')
          ? style.backgroundColor
          : token.startsWith('text-')
            ? style.color
            : style.borderTopColor
        return [name, colour]
      }),
    )
  } finally {
    probe.remove()
  }
}

type Frame = { draw(code: string): Promise<string | undefined> }
let framed: Frame | undefined

/**
 * The page's one drawing frame: a sandbox of an opaque origin, off the screen by the CSSOM (a hidden
 * frame is not laid out, and the library cannot measure in it), that holds the diagram library.
 * It hears only the frame's window and answers each block with the drawn SVG, or nothing.
 */
function frame(): Frame {
  if (framed !== undefined) return framed
  const element = document.createElement('iframe')
  element.setAttribute('sandbox', 'allow-scripts')
  element.setAttribute('aria-hidden', 'true')
  element.tabIndex = -1
  Object.assign(element.style, {
    position: 'absolute',
    left: '-10000px',
    top: '0',
    width: '1200px',
    height: '800px',
    border: '0',
  })
  const waiting = new Map<number, (reply: Reply) => void>()
  const ready = Promise.withResolvers<void>()
  window.addEventListener('message', (event) => {
    if (event.source !== element.contentWindow) return
    const data: unknown = event.data
    if (typeof data !== 'object' || data === null) return
    if (Object(data).ready === true) return ready.resolve()
    const { id, ok, svg } = Object(data)
    if (typeof id !== 'number' || typeof ok !== 'boolean') return
    waiting.get(id)?.({ id, ok, ...(typeof svg === 'string' ? { svg } : {}) })
  })
  element.src = DIAGRAM_FRAME.path
  document.body.append(element)
  let next = 0
  framed = {
    async draw(code) {
      const id = next++
      const answer = Promise.withResolvers<Reply>()
      waiting.set(id, answer.resolve)
      const timeout = AbortSignal.timeout(DRAW_TIMEOUT_MS)
      const lapsed = new Promise<undefined>((resolve) =>
        timeout.addEventListener('abort', () => resolve(undefined)),
      )
      try {
        if ((await Promise.race([ready.promise.then(() => true), lapsed])) === undefined) {
          return undefined
        }
        element.contentWindow?.postMessage({ id, code, themeVariables: themeVariables() }, '*')
        const reply = await Promise.race([answer.promise, lapsed])
        return reply?.ok === true ? reply.svg : undefined
      } finally {
        waiting.delete(id)
      }
    },
  }
  return framed
}

const DARK = '(prefers-color-scheme: dark)'

/** The scheme the page shows, which redraws a diagram when it changes (the pick, or the system's). */
function useScheme(): string {
  const { choice } = useTheme()
  const system = useSyncExternalStore(
    (changed) => {
      const media = matchMedia(DARK)
      media.addEventListener('change', changed)
      return () => media.removeEventListener('change', changed)
    },
    () => matchMedia(DARK).matches,
  )
  return choice === 'system' ? (system ? 'dark' : 'light') : choice
}

function imageOf(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * A closed ```mermaid block of a settled answer: its code (`children`) until it is drawn, then the
 * image; the code and one line when it cannot be drawn.
 */
export function Diagram({ code, children }: { code: string; children: ReactNode }): ReactNode {
  const scheme = useScheme()
  const [drawn, setDrawn] = useState<Drawn>({ kind: 'DRAWING' })
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new scheme draws the block again
  useEffect(() => {
    let current = true
    setDrawn({ kind: 'DRAWING' })
    void frame()
      .draw(code)
      .then((svg) => {
        if (current)
          setDrawn(svg === undefined ? { kind: 'NOT_DRAWN' } : { kind: 'DRAWN', src: imageOf(svg) })
      })
    return () => {
      current = false
    }
  }, [code, scheme])
  switch (drawn.kind) {
    case 'DRAWING':
      return children
    case 'DRAWN':
      return (
        <div className="max-w-full overflow-x-auto rounded-control border border-line bg-surface p-md">
          <img src={drawn.src} alt="Diagrama" className="mx-auto max-w-full" />
        </div>
      )
    case 'NOT_DRAWN':
      return (
        <div className="flex flex-col gap-sm">
          {children}
          <p className="text-label text-text-2">Não foi possível desenhar este diagrama.</p>
        </div>
      )
    default:
      return drawn satisfies never
  }
}
