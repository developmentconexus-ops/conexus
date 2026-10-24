import type { Message, MessageId, ModelId } from '@conexus/hub-api'
import { useEffect, useRef } from 'react'
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
import type { TranscriptItem } from './parts.ts'
import { itemsOf } from './parts.ts'
import { PersonBubble, PersonTurn } from './person-turn.tsx'
import type { Steer } from './steers.ts'
import { STEER_PENDING } from './text.ts'
import type { Entry, Timeline } from './timeline.ts'
import { merge } from './timeline.ts'

type Group = { key: MessageId; person: Message | undefined; builder: Message[] }

/** The turns of the conversation (Factory `groupTurns`): each opens at the person's message. */
function turnsOf(entries: readonly Entry[]): Group[] {
  const turns: Group[] = []
  for (const entry of entries) {
    if (entry.kind === 'asked') turns.push({ key: entry.id, person: undefined, builder: [] })
    else if (entry.message.role === 'person')
      turns.push({ key: entry.message.id, person: entry.message, builder: [] })
    else {
      const last = turns.at(-1)
      if (last === undefined)
        turns.push({ key: entry.message.id, person: undefined, builder: [entry.message] })
      else last.builder.push(entry.message)
    }
  }
  return turns
}

/** A turn as the transcript draws it: the person's message and the Builder's rows, under one key. */
export type ShownTurn = {
  key: MessageId
  person: Message | undefined
  items: readonly TranscriptItem[]
  model: ModelId | null
  streaming: boolean
}

/** The conversation's one list, the read joined to the timeline, by turn; the last streams while the turn runs. */
export function shownOf(
  timeline: Timeline,
  read: readonly Message[],
  running: boolean,
): ShownTurn[] {
  const turns = turnsOf(merge(timeline, read))
  return turns.map((turn, index) => {
    const streaming = running && index === turns.length - 1
    return {
      key: turn.key,
      person: turn.person,
      items: itemsOf(turn.builder, { ...timeline, live: streaming }),
      model: turn.builder.findLast((message) => message.model !== null)?.model ?? null,
      streaming,
    }
  })
}

/**
 * The conversation as a log a screen reader follows: `aria-busy` holds its announcements while the
 * answer arrives, so the finished answer is read once and not word by word. The scroller follows
 * the end of the answer until the person scrolls up, and the button takes them back (design V54).
 * A message the person sends takes them to the end even from above (founder, 2026-10-20). Each
 * turn keeps its key, the person's message id, live and read alike, so an open card is not mounted
 * again when the read takes the stream's place (Factory `Transcript.tsx`, `key={entry.id}`). A
 * message sent into the running turn stays pinned below the answer, saying so, until the stream
 * tells Mastra read it (design V54).
 */
export function Transcript(props: {
  turns: readonly ShownTurn[]
  steers: readonly Steer[]
  model: ModelId
}) {
  const { turns } = props
  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <EndOnSent last={turns.at(-1)?.key} />
      <MessageScroller>
        <MessageScrollerViewport aria-label="Rolagem da conversa" className="px-md pt-md">
          <MessageScrollerContent
            aria-label="Conversa com o Builder"
            className="pb-xl"
            aria-live="polite"
            aria-busy={turns.at(-1)?.streaming === true}
          >
            {turns.map((turn) => (
              <MessageScrollerItem key={turn.key} messageId={turn.key}>
                {turn.person !== undefined && <PersonTurn message={turn.person} />}
                {(turn.items.length > 0 || turn.streaming) && (
                  <BuilderTurn
                    items={turn.items}
                    model={turn.model ?? props.model}
                    streaming={turn.streaming}
                  />
                )}
              </MessageScrollerItem>
            ))}
            {props.steers.map((steer) => (
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

/** Jumps to the end, and follows it again, when a message of the person's opens a turn. */
function EndOnSent(props: { last: MessageId | undefined }) {
  const { scrollToEnd } = useMessageScroller()
  const seen = useRef(props.last)
  useEffect(() => {
    if (props.last === seen.current) return
    seen.current = props.last
    scrollToEnd()
  }, [props.last, scrollToEnd])
  return null
}
