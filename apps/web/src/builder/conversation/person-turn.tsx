import { FileTextIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { hourOf } from '../../platform/dates.ts'
import {
  Attachment,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '../../ui/attachment.tsx'
import { Bubble, BubbleContent } from '../../ui/bubble.tsx'
import { MessageContent, MessageFooter, Message as Turn } from '../../ui/message.tsx'
import type { Chip, Message } from './messages.ts'
import { sentOf } from './messages.ts'

/** A file as a chip: an image in miniature, any other file by its icon, then its name; `action` at its end. */
export function FileChip(props: { file: Chip; action?: ReactNode }) {
  return (
    <Attachment>
      <AttachmentMedia>
        {props.file.image === null ? (
          <FileTextIcon aria-hidden="true" />
        ) : (
          <img src={props.file.image} alt="" />
        )}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{props.file.filename}</AttachmentTitle>
      </AttachmentContent>
      {props.action}
    </Attachment>
  )
}

/** The person's bubble, with `footer` under it: the hour of a sent message, or what a pending one waits for. */
export function PersonBubble(props: { text: string; files: readonly Chip[]; footer: ReactNode }) {
  return (
    <Turn align="end">
      <MessageContent>
        {props.files.length > 0 && (
          <AttachmentGroup
            role="group"
            aria-label="Arquivos"
            className="flex-wrap justify-end self-end"
          >
            {props.files.map((file, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: chips never reorder, and two files can share a name
              <FileChip key={`${index}:${file.filename}`} file={file} />
            ))}
          </AttachmentGroup>
        )}
        {props.text !== '' && (
          <Bubble align="end">
            <BubbleContent className="whitespace-pre-wrap">{props.text}</BubbleContent>
          </Bubble>
        )}
        <MessageFooter>{props.footer}</MessageFooter>
      </MessageContent>
    </Turn>
  )
}

export function PersonTurn({ message }: { message: Message }) {
  const { text, files } = sentOf(message)
  return <PersonBubble text={text} files={files} footer={hourOf(message.createdAt)} />
}
