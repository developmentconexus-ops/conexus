import type { Message, ModelId } from '@conexus/hub-api'
import { useEffect, useMemo, useRef } from 'react'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
} from '../../ui/message-scroller.tsx'
import { BuilderTurn } from './builder-turn.tsx'
import { PersonBubble, PersonTurn } from './person-turn.tsx'
import type { Steer } from './steers.ts'
import { STEER_PENDING } from './text.ts'
import type { TranscriptItem } from './transcript.ts'
import { fromMessages } from './transcript.ts'

/**
 * The conversation as a log a screen reader follows: `aria-busy` holds its announcements while the
 * answer arrives, so the finished answer is read once and not word by word. The scroller follows
 * the end of the answer until the person scrolls up, and the button takes them back (design V54).
 * A message the person sends takes them to the end even from above (founder, 2026-10-20). The
 * answer in progress has no saved message yet, so it is told the conversation's model. A message
 * sent into the running turn stays pinned below the answer, saying so, until the stream tells
 * Mastra read it (design V54).
 */
export function Transcript(props: {
  messages: readonly Message[]
  answer: { items: readonly TranscriptItem[]; streaming: boolean } | null
  steers?: readonly Steer[]
  model: ModelId
}) {
  const { answer } = props
  const saved = useMemo(
    () => new Map(props.messages.map((message) => [message.id, fromMessages([message])])),
    [props.messages],
  )
  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <EndOnSent messages={props.messages} />
      <MessageScroller>
        <MessageScrollerViewport aria-label="Rolagem da conversa" className="px-md pt-md">
          <MessageScrollerContent
            aria-label="Conversa com o Builder"
            className="pb-xl"
            aria-live="polite"
            aria-busy={answer?.streaming === true}
          >
            {props.messages.map((message) => (
              <MessageScrollerItem key={message.id} messageId={message.id}>
                {message.role === 'person' ? (
                  <PersonTurn message={message} />
                ) : (
                  <BuilderTurn
                    items={saved.get(message.id) ?? []}
                    model={message.model}
                    streaming={false}
                  />
                )}
              </MessageScrollerItem>
            ))}
            {answer !== null && (
              <MessageScrollerItem messageId="answer">
                <BuilderTurn
                  items={answer.items}
                  model={props.model}
                  streaming={answer.streaming}
                />
              </MessageScrollerItem>
            )}
            {(props.steers ?? []).map((steer) => (
              <MessageScrollerItem key={steer.id} messageId={steer.id}>
                <PersonBubble text={steer.content} footer={<span>{STEER_PENDING}</span>} />
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}

/** Jumps to the end, and follows it again, when a new message of the person's arrives. */
function EndOnSent(props: { messages: readonly Message[] }) {
  const { scrollToEnd } = useMessageScroller()
  const last = props.messages.findLast((message) => message.role === 'person')?.id
  const seen = useRef(last)
  useEffect(() => {
    if (last === seen.current) return
    seen.current = last
    scrollToEnd()
  }, [last, scrollToEnd])
  return null
}
