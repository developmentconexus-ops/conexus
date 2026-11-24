import { DIAGRAM_FRAME } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { z } from 'zod'
import { useTheme } from '../../platform/theme.ts'

/** What a mermaid block became: being drawn, drawn as an image, or left as its code. */
type Drawn =
  | { kind: 'DRAWING' }
  | { kind: 'DRAWN'; src: string; width: number }
  | { kind: 'NOT_DRAWN' }

/** What the frame says: that it is ready, or the answer to one request (read once, code C27). */
const Reply = z.object({ id: z.number(), ok: z.boolean(), svg: z.string().optional() })
type Reply = z.infer<typeof Reply>
const FrameMessage = z.union([z.object({ ready: z.literal(true) }), Reply])

/** The frame answers in this long at the most; past it the block stays code. */
const DRAW_TIMEOUT_MS = 20_000

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
    const message = FrameMessage.safeParse(event.data)
    if (!message.success) return
    if ('ready' in message.data) return ready.resolve()
    waiting.get(message.data.id)?.(message.data)
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

/**
 * The drawn size, from the `viewBox` the library draws: its SVG says `width="100%"`, which an image
 * in a block that fits its content cannot resolve, and the picture collapses (streamdown
 * `lib/mermaid/utils.ts` `getMermaidSvgSize`, which sizes the picture the same way).
 */
function widthOf(svg: string): number | undefined {
  const box = /<svg\b[^>]*\sviewBox="[^"]*?\s([\d.]+)\s[\d.]+"/.exec(svg)
  const width = Number(box?.[1])
  return width > 0 ? width : undefined
}

function imageOf(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * A closed ```mermaid block of a settled answer: its code (`children`) until it is drawn, then the
 * image; the code and one line when it cannot be drawn.
 */
export function Diagram(props: { code: string; children: ReactNode }): ReactNode {
  // A new scheme mounts the block again, which draws it with the other colours.
  return <Drawing key={useScheme()} {...props} />
}

function Drawing({ code, children }: { code: string; children: ReactNode }): ReactNode {
  const [drawn, setDrawn] = useState<Drawn>({ kind: 'DRAWING' })
  useEffect(() => {
    let current = true
    void frame()
      .draw(code)
      .then((svg) => {
        if (!current) return
        const width = svg === undefined ? undefined : widthOf(svg)
        setDrawn(
          svg === undefined || width === undefined
            ? { kind: 'NOT_DRAWN' }
            : { kind: 'DRAWN', src: imageOf(svg), width },
        )
      })
    return () => {
      current = false
    }
  }, [code])
  switch (drawn.kind) {
    case 'DRAWING':
      return children
    case 'DRAWN':
      return (
        <div className="max-w-full overflow-x-auto rounded-control border border-line bg-surface p-md">
          <img src={drawn.src} alt="Diagrama" width={drawn.width} className="mx-auto max-w-none" />
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
