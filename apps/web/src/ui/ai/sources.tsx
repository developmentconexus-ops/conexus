import type { ReactElement, ReactNode } from 'react'
import { Stamp } from '../block.tsx'
import { cn } from '../cn.ts'

export type SourceView =
  /** `href` only when the page has a link. */
  | { kind: 'PAGE'; key: string; title: string; href: string | undefined; domain: string }
  | {
      kind: 'TABLE'
      key: string
      name: string
      /** The logo, drawn by the caller. */
      logo: ReactNode | undefined
      table: string
      stamp: { tone: 'neutral' | 'success' | 'warning' | 'danger'; text: string }
    }

/** The class that gives a stamp its tone: the words stay `text-2` except where the run did not go through. */
const STAMPS = {
  neutral: 'before:bg-line-strong',
  success: 'text-text-2 before:bg-success',
  warning: '',
  danger: '',
} as const

function TableLine({ source }: { source: Extract<SourceView, { kind: 'TABLE' }> }) {
  return (
    <li className="flex min-h-8 min-w-0 flex-wrap items-center gap-x-sm gap-y-xs py-xs not-first:border-t not-first:border-line">
      {source.logo}
      <span className="min-w-0 break-words text-label font-medium text-text">{source.name}</span>
      <span aria-hidden="true" className="basis-full @md:hidden" />
      <span
        className={cn(
          'min-w-0 break-all rounded-control bg-surface-3 px-xs font-mono text-fact text-text',
          source.logo !== undefined && '@max-md:ms-7',
        )}
      >
        {source.table}
      </span>
      <span className="@md:ms-auto">
        <Stamp tone={source.stamp.tone} className={STAMPS[source.stamp.tone]}>
          {source.stamp.text}
        </Stamp>
      </span>
    </li>
  )
}

function PageLine({ source }: { source: Extract<SourceView, { kind: 'PAGE' }> }) {
  return (
    <li className="flex min-w-0 flex-wrap gap-x-sm py-xs">
      <span className="min-w-0 break-words">
        {source.href !== undefined ? (
          <a
            href={source.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text underline underline-offset-2"
          >
            {source.title}
          </a>
        ) : (
          source.title
        )}
      </span>
      {source.domain !== '' && <span className="min-w-0 break-all">{source.domain}</span>}
    </li>
  )
}

/**
 * Where an answer found what it says, under the message: each page's title and domain, each
 * live read's system and table. Today's shape, not shadcn's Trace recipe (card's debt).
 */
export function Sources(props: { label: string; sources: readonly SourceView[] }): ReactElement {
  const { label, sources } = props
  return (
    <section
      aria-label={label}
      className="@container mx-md flex min-w-0 flex-col gap-xs border-t border-line pt-sm text-fact text-text-2"
    >
      <h3 className="text-label font-semibold text-text">{label}</h3>
      <ul className="m-0 flex min-w-0 list-none flex-col p-0">
        {sources.map((source) =>
          source.kind === 'TABLE' ? (
            <TableLine key={source.key} source={source} />
          ) : (
            <PageLine key={source.key} source={source} />
          ),
        )}
      </ul>
    </section>
  )
}
