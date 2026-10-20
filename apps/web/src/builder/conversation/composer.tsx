import type { ConversationId } from '@conexus/hub-api'
import { MESSAGE_MAX_LENGTH } from '@conexus/hub-api'
import { SquareIcon } from 'lucide-react'
import type { KeyboardEvent, ReactNode, Ref, SubmitEvent } from 'react'
import { Button } from '../../ui/button.tsx'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '../../ui/input-group.tsx'
import { Label } from '../../ui/label.tsx'
import { useDraft } from './draft.ts'

/**
 * The field and its buttons. Enter sends and Shift+Enter breaks the line, except while an input
 * method is composing a character (design V30). While the Builder answers, **Parar** takes the
 * place of sending, and focus goes back to the field. What is typed is kept per conversation.
 */
export function Composer(props: {
  answering: boolean
  canSend: boolean
  conversationId: ConversationId
  field: Ref<HTMLTextAreaElement>
  onSend: (content: string) => Promise<boolean>
  onStop: () => void
  picker: ReactNode
}) {
  const [content, setContent] = useDraft(props.conversationId)
  const empty = content.trim() === ''

  async function send() {
    if (empty || props.answering || !props.canSend) return
    if (await props.onSend(content)) setContent('')
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    void send()
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    void send()
  }

  return (
    <form onSubmit={submit} className="sticky bottom-0 bg-canvas pt-md pb-md">
      <div
        data-busy={props.answering || undefined}
        className="rounded-composer bg-line p-0.5 data-busy:working-ring"
      >
        <InputGroup className="rounded-[calc(var(--radius-composer)-1px)] border-0">
          <Label htmlFor="message" className="sr-only">
            Mensagem para o Builder
          </Label>
          <InputGroupTextarea
            id="message"
            ref={props.field}
            value={content}
            maxLength={MESSAGE_MAX_LENGTH}
            placeholder="Escreva sua mensagem"
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <InputGroupAddon align="block-end" className="flex-nowrap gap-sm">
            {props.picker}
            <span className="flex-1" />
            {props.answering ? (
              <Button type="button" onClick={props.onStop}>
                <SquareIcon aria-hidden="true" />
                Parar
              </Button>
            ) : (
              <Button type="submit" variant="primary" disabled={empty || !props.canSend}>
                Enviar
              </Button>
            )}
          </InputGroupAddon>
        </InputGroup>
      </div>
    </form>
  )
}
