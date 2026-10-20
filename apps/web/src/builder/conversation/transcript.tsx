import type { Message, MessagePart, ModelId } from '@conexus/hub-api'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '../../ui/message-scroller.tsx'
import { BuilderTurn } from './builder-turn.tsx'
import { PersonTurn } from './person-turn.tsx'

/**
 * The conversation as a log a screen reader follows: `aria-busy` holds its announcements while the
 * answer arrives, so the finished answer is read once and not word by word. The scroller follows
 * the end of the answer until the person scrolls up, and the button takes them back (design V54).
 * The answer in progress has no saved message yet, so it is told the conversation's model.
 */
export function Transcript(props: {
  messages: readonly Message[]
  answer: { parts: readonly MessagePart[]; streaming: boolean } | null
  model: ModelId
}) {
  const { answer } = props
  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller>
        <MessageScrollerViewport aria-label="Rolagem da conversa" className="px-md pt-md">
          <MessageScrollerContent
            aria-label="Conversa com o Builder"
            aria-live="polite"
            aria-busy={answer?.streaming === true}
          >
            {props.messages.map((message) => (
              <MessageScrollerItem key={message.id} messageId={message.id}>
                {message.role === 'person' ? (
                  <PersonTurn message={message} />
                ) : (
                  <BuilderTurn parts={message.parts} model={message.model} streaming={false} />
                )}
              </MessageScrollerItem>
            ))}
            {answer !== null && (
              <MessageScrollerItem messageId="answer">
                <BuilderTurn
                  parts={answer.parts}
                  model={props.model}
                  streaming={answer.streaming}
                />
              </MessageScrollerItem>
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}
