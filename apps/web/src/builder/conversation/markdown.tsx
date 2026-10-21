import type { ReactNode } from 'react'
import { memo } from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remend from 'remend'
import { cn } from '../../ui/cn.ts'
import { splitBlocks } from './markdown-blocks.ts'

/** An address a person may open: http or https only; any other scheme is shown as text. */
function safeAddress(raw: string): string | undefined {
  const url = URL.parse(raw)
  return url?.protocol === 'https:' || url?.protocol === 'http:' ? url.href : undefined
}

export function Anchor(props: { href: string; children: ReactNode }) {
  const href = safeAddress(props.href)
  if (href === undefined) return <>{props.children}</>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
      {props.children}
      <span className="sr-only"> (abre em outra aba)</span>
    </a>
  )
}

// Links stay text until their address lands: remend's placeholder address would be a live link to
// nowhere. No math is drawn, so pairing `$$` would only turn one literal into another.
const REMEND = { katex: false, linkMode: 'text-only' } as const

const REMARK_PLUGINS = [remarkGfm]

// react-markdown draws no HTML of its own and drops unsafe addresses; each element is listed so
// its `node` prop never reaches the DOM.
const ELEMENTS: Components = {
  a: ({ href, children }) => <Anchor href={href ?? ''}>{children}</Anchor>,
  h1: ({ children }) => <p className="font-display font-semibold">{children}</p>,
  h2: ({ children }) => <p className="font-display font-semibold">{children}</p>,
  h3: ({ children }) => <p className="font-display font-semibold">{children}</p>,
  h4: ({ children }) => <p className="font-display font-semibold">{children}</p>,
  h5: ({ children }) => <p className="font-display font-semibold">{children}</p>,
  h6: ({ children }) => <p className="font-display font-semibold">{children}</p>,
  ul: ({ children, className }) => (
    <ul
      className={cn(
        'flex flex-col gap-xs',
        className?.includes('contains-task-list') ? 'list-none' : 'list-disc pl-xl',
      )}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => <ol className="flex list-decimal flex-col gap-xs pl-xl">{children}</ol>,
  li: ({ children }) => <li className="[&>ol]:mt-xs [&>ul]:mt-xs">{children}</li>,
  input: ({ checked }) => (
    <input type="checkbox" checked={checked} disabled readOnly className="mr-sm accent-accent" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="flex flex-col gap-sm border-line-strong border-l-2 pl-md text-text-2">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-line" />,
  del: ({ children }) => <del className="text-text-2">{children}</del>,
  code: ({ children }) => (
    <code className="rounded-control bg-surface-3 px-xs font-mono text-fact">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-control border border-line bg-surface-3 p-md font-mono text-fact [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="max-w-full overflow-x-auto">
      <table className="border-collapse text-label">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="min-w-24 border border-line bg-surface-3 px-md py-sm text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="min-w-24 border border-line px-md py-sm text-left">{children}</td>
  ),
}

/** Keyed by the line it starts at: a content key would remount the block on every character. */
const Block = memo(function Block({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={ELEMENTS}>
      {content}
    </ReactMarkdown>
  )
})

/**
 * An answer's text as the page, drawn as GitHub-flavoured Markdown with no HTML of its own.
 * Rendered block by block, so a streaming answer parses only its last block, and that one with
 * its open marks closed ("**Pad" shows bold at once); a block that settled is not drawn again.
 */
export function Markdown({ text, streaming = false }: { text: string; streaming?: boolean }) {
  const blocks = splitBlocks(text)
  const last = blocks.length - 1
  return (
    <div className="flex min-w-0 flex-col gap-md break-words">
      {blocks.map(({ start, text }, at) => (
        <Block key={start} content={streaming && at === last ? remend(text, REMEND) : text} />
      ))}
    </div>
  )
}
