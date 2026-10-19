import type { ReactNode } from 'react'
import { cn } from '../../ui/cn.ts'

type Item = { id: number; text: string }
type Block = { id: number } & (
  | { kind: 'p' | 'heading' | 'code'; text: string }
  | { kind: 'ul' | 'ol'; items: Item[] }
)
type Draft =
  | { kind: 'p' | 'heading' | 'code'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }

const BULLET = /^\s*[-*] +(.*)$/
const NUMBER = /^\s*\d+[.)] +(.*)$/
const HEADING = /^#{1,6} +(.*)$/

/** The blocks of a text: paragraphs, headings, lists and fenced code, which stays open to the end. */
function blocksOf(text: string): Block[] {
  const blocks: Draft[] = []
  let code: string[] | undefined
  function add(kind: 'ul' | 'ol', item: string) {
    const last = blocks.at(-1)
    if (last?.kind === kind) last.items.push(item)
    else blocks.push({ kind, items: [item] })
  }
  for (const line of text.split('\n')) {
    if (line.startsWith('```')) {
      if (code === undefined) code = []
      else {
        blocks.push({ kind: 'code', text: code.join('\n') })
        code = undefined
      }
    } else if (code !== undefined) code.push(line)
    else if (line.trim() === '') blocks.push({ kind: 'p', text: '' })
    else if (HEADING.test(line)) blocks.push({ kind: 'heading', text: line.replace(/^#+ +/, '') })
    else if (BULLET.test(line)) add('ul', line.replace(BULLET, '$1'))
    else if (NUMBER.test(line)) add('ol', line.replace(NUMBER, '$1'))
    else {
      const last = blocks.at(-1)
      if (last?.kind === 'p' && last.text !== '') last.text += ` ${line.trim()}`
      else blocks.push({ kind: 'p', text: line.trim() })
    }
  }
  if (code !== undefined) blocks.push({ kind: 'code', text: code.join('\n') })
  return blocks
    .filter((block) => block.kind !== 'p' || block.text !== '')
    .map(
      (block, id): Block =>
        'items' in block
          ? { kind: block.kind, id, items: block.items.map((text, at) => ({ id: at, text })) }
          : { ...block, id },
    )
}

/**
 * The text of an answer still arriving, its last line closed where a mark is open, so "**Pad"
 * shows bold at once and not as two asterisks until the rest comes. Inside an open fence it stays.
 */
function closed(text: string): string {
  if ((text.match(/^```/gm)?.length ?? 0) % 2 === 1) return text
  const cut = text.lastIndexOf('\n') + 1
  const tail = text.slice(cut)
  const bold = (tail.match(/\*\*/g)?.length ?? 0) % 2 === 1 ? '**' : ''
  const ticks = (tail.replaceAll('**', '').match(/`/g)?.length ?? 0) % 2 === 1 ? '`' : ''
  return text + ticks + bold
}

const INLINE = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|\*([^*\s][^*\n]*)\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g

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

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let from = 0
  for (const match of text.matchAll(INLINE)) {
    const [whole, code, bold, italic, label, address] = match
    out.push(text.slice(from, match.index))
    const key = `${match.index}`
    if (code !== undefined) {
      out.push(
        <code key={key} className="font-mono text-fact">
          {code}
        </code>,
      )
    } else if (bold !== undefined) out.push(<strong key={key}>{bold}</strong>)
    else if (italic !== undefined) out.push(<em key={key}>{italic}</em>)
    else if (label !== undefined && address !== undefined) {
      out.push(
        <Anchor key={key} href={address}>
          {label}
        </Anchor>,
      )
    }
    from = (match.index ?? 0) + whole.length
  }
  out.push(text.slice(from))
  return out
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'heading':
      return <p className="font-display font-semibold">{inline(block.text)}</p>
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-control border border-line bg-surface-3 p-md font-mono text-fact">
          {block.text}
        </pre>
      )
    case 'ul':
    case 'ol': {
      const List = block.kind
      return (
        <List
          className={cn(
            'flex flex-col gap-xs pl-xl',
            block.kind === 'ul' ? 'list-disc' : 'list-decimal',
          )}
        >
          {block.items.map((item) => (
            <li key={item.id}>{inline(item.text)}</li>
          ))}
        </List>
      )
    }
    case 'p':
      return <p>{inline(block.text)}</p>
    default:
      return block satisfies never
  }
}

/** An answer's text as the page: the marks a model writes, drawn without any HTML of its own. */
export function Markdown({ text, streaming = false }: { text: string; streaming?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-md break-words">
      {blocksOf(streaming ? closed(text) : text).map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  )
}
