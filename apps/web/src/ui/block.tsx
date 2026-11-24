import type { ComponentProps, ReactNode } from 'react'
import { Badge } from './badge.tsx'
import { cn } from './cn.ts'

/** The most rows a block of Início shows before "Mais N" (design `block`). */
export const BLOCK_ROWS = 5

/** The one row of the Hub's lists: 32px, 44 on touch (design V58). Menus and blocks both draw from it. */
export const listRow =
  'flex h-row w-full min-w-0 items-center gap-md px-sm text-label pointer-coarse:h-11'

/** A row of a block: the list row with a hairline under it. */
export const blockRow = `${listRow} border-b border-line`

/** A row to choose from, in a menu or a chooser: the list row, rounded, lit under the pointer. */
export const choiceRow = cn(
  listRow,
  'shrink-0 gap-sm rounded-control text-left text-text hover:bg-surface-3',
)

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

/** A state in words with a dot of its colour, never the colour alone (design V35): the Badge without its frame. */
export function Stamp(props: {
  tone: NonNullable<ComponentProps<typeof Badge>['tone']>
  /** Where a state's words and its dot differ in colour, as a source's: the words in `text-2`, the dot in the tone. */
  className?: string
  children: ReactNode
}) {
  return (
    <Badge
      tone={props.tone}
      className={cn(
        'h-auto border-0 bg-transparent px-0 text-eyebrow tabular-nums before:inline-block',
        props.className,
      )}
    >
      {props.children}
    </Badge>
  )
}
