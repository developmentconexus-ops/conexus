import type { ModelId } from '@conexus/hub-api'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { Button } from '../../ui/button.tsx'
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
import type { Message } from './messages.ts'
import { chipOf, messageOf } from './messages.ts'
import { PersonBubble, PersonTurn } from './person-turn.tsx'
import type { TranscriptItem } from './rows.ts'
import { itemsOf } from './rows.ts'
import type { SessionState, Steer } from './session-state.ts'
import { LOAD_OLDER, STEER_PENDING } from './text.ts'

type Group = { key: string; person: Message | undefined; builder: Message[] }

/** The turns of the conversation (Factory `groupTurns`): each opens at the person's message. */
function turnsOf(messages: readonly Message[]): Group[] {
  const turns: Group[] = []
  for (const message of messages) {
    const last = turns.at(-1)
    if (message.role === 'person' || last === undefined)
      turns.push({
        key: message.id,
        person: message.role === 'person' ? message : undefined,
        builder: message.role === 'person' ? [] : [message],
      })
    else last.builder.push(message)
  }
  return turns
}

/** A turn as the transcript draws it: the person's message and the Builder's rows, under one key. */
export type ShownTurn = {
  key: string
  person: Message | undefined
  items: readonly TranscriptItem[]
  model: ModelId | null
  streaming: boolean
}

/** The conversation's one list, from the session's messages, by turn; the last streams while the run runs. */
export function shownOf(state: SessionState): ShownTurn[] {
  const turns = turnsOf(state.messages.flatMap((stored) => messageOf(stored) ?? []))
  return turns.map((turn, index) => {
    const streaming = state.running && index === turns.length - 1
    const view = { suspended: state.suspended, running: state.commands, heard: state.heard }
    return {
      key: turn.key,
      person: turn.person,
      items: itemsOf(turn.builder, { ...view, live: streaming }),
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
  older: { has: boolean; loading: boolean; load: () => void }
  onAsk: (text: string) => void
}) {
  const { turns, older } = props
  const viewport = useRef<HTMLDivElement>(null)
  const place = useRef<Place | null>(null)
  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <EndOnSent last={turns.at(-1)?.key} />
      <KeepPlace first={turns[0]?.key} place={place} />
      <MessageScroller>
        <MessageScrollerViewport
          ref={viewport}
          aria-label="Rolagem da conversa"
          className="px-md pt-md"
        >
          <MessageScrollerContent
            aria-label="Conversa com o Builder"
            className="pb-xl"
            aria-live="polite"
            aria-busy={turns.at(-1)?.streaming === true}
          >
            {older.has && (
              <Button
                variant="ghost"
                className="self-center"
                disabled={older.loading}
                onClick={() => {
                  const element = viewport.current
                  if (element !== null)
                    place.current = {
                      element,
                      height: element.scrollHeight,
                      top: element.scrollTop,
                    }
                  older.load()
                }}
              >
                {LOAD_OLDER}
              </Button>
            )}
            {turns.map((turn) => (
              <MessageScrollerItem key={turn.key} messageId={turn.key}>
                {turn.person !== undefined && <PersonTurn message={turn.person} />}
                {(turn.items.length > 0 || turn.streaming) && (
                  <BuilderTurn
                    items={turn.items}
                    model={turn.model ?? props.model}
                    streaming={turn.streaming}
                    onAsk={props.onAsk}
                  />
                )}
              </MessageScrollerItem>
            ))}
            {props.steers.map((steer) => (
              <MessageScrollerItem key={steer.id} messageId={steer.id}>
                <PersonBubble
                  text={steer.content}
                  files={steer.files.map(chipOf)}
                  footer={<span>{STEER_PENDING}</span>}
                />
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}

/** No older messages: the whole conversation is on screen. */
export const NO_OLDER = { has: false, loading: false, load: () => undefined }

/** Jumps to the end, and follows it again, when a message of the person's opens a turn. */
function EndOnSent(props: { last: string | undefined }) {
  const { scrollToEnd } = useMessageScroller()
  const seen = useRef(props.last)
  useEffect(() => {
    if (props.last === seen.current) return
    seen.current = props.last
    scrollToEnd()
  }, [props.last, scrollToEnd])
  return null
}

/**
 * Keeps the place the person was reading when older messages arrive above: the viewport's height
 * and scroll are taken when they ask for them, and when the first turn changes the scroll moves
 * by what the height grew.
 */
function KeepPlace(props: { first: string | undefined; place: React.RefObject<Place | null> }) {
  const { place } = props
  const first = useRef(props.first)
  useLayoutEffect(() => {
    const kept = place.current
    if (first.current === props.first) return
    first.current = props.first
    if (kept === null) return
    place.current = null
    kept.element.scrollTop = kept.top + (kept.element.scrollHeight - kept.height)
  })
  return null
}

type Place = { element: HTMLElement; height: number; top: number }
