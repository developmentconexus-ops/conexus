import type { Message, MessagePart } from '@conexus/hub-api'
import { cn } from '../../ui/cn.ts'
import { Anchor, Markdown } from './markdown.tsx'

/** A page the Builder read, said as a sentence (design V39); the address opens only if it is http(s). */
function PageRead({ url, title }: { url: string; title: string | null }) {
  const label = title ?? URL.parse(url)?.hostname ?? url
  return (
    <p className="text-label text-text-2">
      Li a página <Anchor href={url}>{label}</Anchor>
    </p>
  )
}

function Part(props: { part: MessagePart; person: boolean; streaming: boolean }) {
  const { part } = props
  switch (part.type) {
    case 'text':
      return props.person ? (
        <p className="whitespace-pre-wrap break-words">{part.text}</p>
      ) : (
        <Markdown text={part.text} streaming={props.streaming} />
      )
    case 'page':
      return <PageRead url={part.url} title={part.title} />
    case 'notice':
      return <p className="border-l-2 border-accent pl-md text-text">{part.text}</p>
  }
}

/** Parts carry no id, so a part's key is its place in the message: parts only ever append. */
function keyed(parts: readonly MessagePart[]) {
  return parts.map((part, at) => ({ part, at }))
}

function MessageView(props: {
  author: Message['role']
  parts: readonly MessagePart[]
  streaming?: boolean
}) {
  const person = props.author === 'person'
  return (
    <div className={cn('flex flex-col gap-sm', person && 'items-end')}>
      <p className="text-label text-text-2">{person ? 'Você' : 'Builder'}</p>
      <div
        className={cn(
          'flex min-w-0 max-w-full flex-col gap-md',
          person && 'rounded-object bg-surface-3 px-md py-sm',
        )}
      >
        {keyed(props.parts).map(({ part, at }) => (
          <Part key={at} part={part} person={person} streaming={props.streaming === true} />
        ))}
      </div>
    </div>
  )
}

/**
 * The conversation as a log a screen reader follows: `aria-busy` holds its announcements while the
 * answer arrives, so the finished answer is read once and not word by word.
 */
export function Transcript(props: {
  messages: readonly Message[]
  answering: readonly MessagePart[] | null
}) {
  return (
    <div
      role="log"
      aria-label="Conversa com o Builder"
      aria-live="polite"
      aria-busy={props.answering !== null}
      className="flex flex-col gap-xl"
    >
      {props.messages.map((message) => (
        <MessageView key={message.id} author={message.role} parts={message.parts} />
      ))}
      {props.answering !== null && (
        <MessageView author="builder" parts={props.answering} streaming />
      )}
    </div>
  )
}
