import type { ReactNode } from 'react'
import { cn } from './cn.ts'

/** The most rows a block of Início shows before "Mais N" (design `block`). */
export const BLOCK_ROWS = 5

/** The one row of the Hub's lists: 32px, 44 on touch (design V58). Menus and blocks both draw from it. */
export const listRow =
  'flex h-row w-full min-w-0 items-center gap-md px-sm text-label pointer-coarse:h-11'

/** A row of a block: the list row with a hairline under it. */
export const blockRow = `${listRow} border-b border-line`

/**
 * A block of Início (web W29): a header row of 32 with the title and its way out, then the rows the
 * caller draws with `blockRow`, in a list that is the block's landmark.
 */
export function Block(props: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={props.title} className="flex min-w-0 flex-col">
      <div className="flex h-row items-center justify-between gap-md px-sm">
        <h2 className="font-body text-label font-semibold">{props.title}</h2>
        {props.action}
      </div>
      {props.children}
    </section>
  )
}

/** The sentence a block with nothing to list says, in the row's own height. */
export function BlockSentence({ children }: { children: ReactNode }) {
  return <p className={cn(blockRow, 'text-text-2')}>{children}</p>
}

const TONES = { success: 'text-success', neutral: 'text-text-2', danger: 'text-danger' } as const

/** A state in words with a dot of its colour, never the colour alone (design V35). */
export function Stamp(props: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-xs text-eyebrow tabular-nums',
        TONES[props.tone],
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-pill bg-current" />
      {props.children}
    </span>
  )
}
