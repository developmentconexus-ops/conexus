import type { Message } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { hourOf } from '../../platform/dates.ts'
import { Bubble, BubbleContent } from '../../ui/bubble.tsx'
import { MessageContent, MessageFooter, Message as Turn } from '../../ui/message.tsx'

/** The person's bubble, with `footer` under it: the hour of a sent message, or what a pending one waits for. */
export function PersonBubble(props: { text: string; footer: ReactNode }) {
  return (
    <Turn align="end">
      <MessageContent>
        <Bubble align="end">
          <BubbleContent className="whitespace-pre-wrap">{props.text}</BubbleContent>
        </Bubble>
        <MessageFooter>{props.footer}</MessageFooter>
      </MessageContent>
    </Turn>
  )
}

function textOf(message: Message): string {
  return message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('\n')
}

export function PersonTurn({ message }: { message: Message }) {
  return <PersonBubble text={textOf(message)} footer={hourOf(message.createdAt)} />
}
