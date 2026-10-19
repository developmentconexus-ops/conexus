import { MESSAGE_MAX_LENGTH } from '@conexus/hub-api'
import { SquareIcon } from 'lucide-react'
import type { KeyboardEvent, Ref, SubmitEvent } from 'react'
import { useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Label } from '../../ui/label.tsx'
import { Textarea } from '../../ui/textarea.tsx'

/**
 * The field and its buttons. Enter sends and Shift+Enter breaks the line, except while an input
 * method is composing a character (design V30). While the Builder answers, **Parar** takes the
 * place of sending, and focus goes back to the field.
 */
export function Composer(props: {
  answering: boolean
  canSend: boolean
  field: Ref<HTMLTextAreaElement>
  onSend: (content: string) => Promise<boolean>
  onStop: () => void
}) {
  const [content, setContent] = useState('')
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
    <form onSubmit={submit} className="sticky bottom-0 flex flex-col gap-sm bg-canvas pt-md pb-md">
      <Label htmlFor="message" className="sr-only">
        Mensagem para o Builder
      </Label>
      <Textarea
        id="message"
        ref={props.field}
        value={content}
        maxLength={MESSAGE_MAX_LENGTH}
        placeholder="Escreva sua mensagem"
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="flex gap-sm">
        <Button
          type="submit"
          variant="primary"
          disabled={empty || props.answering || !props.canSend}
        >
          Enviar
        </Button>
        {props.answering && (
          <Button type="button" onClick={props.onStop}>
            <SquareIcon aria-hidden="true" />
            Parar
          </Button>
        )}
      </div>
    </form>
  )
}
