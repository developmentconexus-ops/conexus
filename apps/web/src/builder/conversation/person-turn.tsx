import type { Message } from '@conexus/hub-api'
import { hourOf } from '../../platform/dates.ts'
import { Bubble, BubbleContent } from '../../ui/bubble.tsx'
import { MessageContent, MessageFooter, Message as Turn } from '../../ui/message.tsx'

function textOf(message: Message): string {
  return message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('\n')
}

export function PersonTurn({ message }: { message: Message }) {
  return (
    <Turn align="end">
      <MessageContent>
        <Bubble align="end">
          <BubbleContent className="whitespace-pre-wrap">{textOf(message)}</BubbleContent>
        </Bubble>
        <MessageFooter>{hourOf(message.createdAt)}</MessageFooter>
      </MessageContent>
    </Turn>
  )
}
