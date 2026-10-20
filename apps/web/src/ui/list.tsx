import { cva } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { cn } from './cn.ts'

export function PageTitle({
  children,
  className,
  title,
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <h1 title={title} className={cn('font-display text-title', className)}>
      {children}
    </h1>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-title">{children}</h2>
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col border-y border-line">{children}</ul>
}

export function Row({ children }: { children: ReactNode }) {
  return <li className="border-b border-line last:border-b-0">{children}</li>
}

/** The line inside a `Row`: a `div` that wraps when it must, or a link that never does. */
export const rowBody = cva('flex items-center justify-between px-sm py-md', {
  variants: {
    kind: {
      wrapping: 'flex-wrap gap-x-md gap-y-xs',
      link: 'gap-md hover:bg-surface-3',
    },
  },
})
