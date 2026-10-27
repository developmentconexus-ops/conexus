import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `code-block` (registry read with shadcn 4.23.0, 2026-10-27),
// painted with brand tokens and cut to what the Código tab uses: the box, its header, the numbered
// lines. The counter reads `counter(line) / ''`, so the numbers are neither selected, copied nor read.
export function CodeBlock({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="code-block"
      className={cn(
        'group/code-block relative flex w-full min-w-0 flex-col overflow-hidden rounded-object border border-line bg-surface text-fact text-text',
        className,
      )}
      {...props}
    />
  )
}

export function CodeBlockHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="code-block-header"
      className={cn(
        'flex min-w-0 shrink-0 items-center gap-sm border-b border-line px-md py-sm text-text-2',
        className,
      )}
      {...props}
    />
  )
}

export function CodeBlockTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="code-block-title"
      className={cn('min-w-0 break-all font-mono text-fact text-text', className)}
      {...props}
    />
  )
}

export function CodeBlockContent({ className, children, ...props }: ComponentProps<'pre'>) {
  return (
    <pre
      data-slot="code-block-content"
      data-numbered
      dir="ltr"
      className={cn(
        'min-h-0 min-w-0 overflow-auto px-md py-md text-start font-mono [counter-reset:line]',
        className,
      )}
      {...props}
    >
      <code
        data-slot="code-block-code"
        className="grid min-h-lh min-w-max grid-cols-[auto_1fr] content-start"
      >
        {children}
      </code>
    </pre>
  )
}

export function CodeBlockLine({ className, children, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="code-block-line"
      className={cn(
        'col-span-2 grid min-h-lh grid-cols-subgrid gap-x-md [counter-increment:line] before:min-w-6 before:text-end before:text-text-2 before:select-none before:content-[counter(line)_/_""]',
        className,
      )}
      {...props}
    >
      {/* An empty line keeps its newline, so copying a selection keeps the blank lines. */}
      <span data-slot="code-block-line-content" className="min-w-0 whitespace-pre">
        {children}
        {'\n'}
      </span>
    </span>
  )
}
