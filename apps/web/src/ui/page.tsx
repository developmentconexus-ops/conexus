import type { ReactNode } from 'react'
import { cn } from './cn.ts'

/**
 * A page's column, as wide as a page reads. Inside a frame that pads and scrolls it, the column only stacks its
 * children; `scrolls` is for a compact frame, where the column pads and scrolls itself.
 */
export function Page(props: { scrolls: boolean; gap: 'lg' | 'xl'; children: ReactNode }) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-page flex-col',
        props.gap === 'xl' ? 'gap-xl' : 'gap-lg',
        props.scrolls && 'min-h-0 flex-1 overflow-y-auto p-xl',
      )}
    >
      {props.children}
    </div>
  )
}
