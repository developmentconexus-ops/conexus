import { MESSAGE_MAX_LENGTH } from '@conexus/hub-api'
import { ArrowUpIcon, SquareIcon } from 'lucide-react'
import type { KeyboardEvent, ReactNode, Ref, SubmitEvent } from 'react'
import { Button } from '../../ui/button.tsx'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '../../ui/input-group.tsx'
import { Label } from '../../ui/label.tsx'
import type { Draft } from './draft.ts'

/** The round button at the end of the field: ink at rest, ipê under the pointer (design V5). */
const ROUND =
  'rounded-pill hover:bg-accent disabled:bg-surface-4 disabled:text-text-2 disabled:opacity-100'

/**
 * The field and its buttons, drawn as the old composer: the model's button and a round send arrow
 * at the end, and the keys below. Enter sends and Shift+Enter breaks the line, except while an
 * input method is composing a character (design V30). While the Builder answers, the round
 * **Parar** takes the place of sending, and focus goes back to the field. What is typed is kept per
 * conversation, by the draft the screen holds.
 */
export function Composer(props: {
  answering: boolean
  canSend: boolean
  draft: Draft
  field: Ref<HTMLTextAreaElement>
  onSend: (content: string) => Promise<boolean>
  onStop: () => void
  picker: ReactNode
  taskPanel?: ReactNode
  memory?: ReactNode
}) {
  const { draft } = props
  const content = draft.text
  const empty = content.trim() === ''

  async function send() {
    if (empty || props.answering || !props.canSend) return
    if (await props.onSend(content)) draft.clear(content)
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
    <form onSubmit={submit} className="sticky bottom-0 flex flex-col gap-xs bg-canvas pb-sm">
      {props.taskPanel}
      <InputGroup
        data-busy={props.answering || undefined}
        className="rounded-composer data-busy:working-ring"
      >
        <Label htmlFor="message" className="sr-only">
          Mensagem para o Builder
        </Label>
        <InputGroupTextarea
          id="message"
          ref={props.field}
          value={content}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder="Escreva sua mensagem"
          onChange={(event) => draft.change(event.target.value)}
          onKeyDown={onKeyDown}
          className="min-h-16 pt-md"
        />
        <InputGroupAddon align="block-end" className="flex-nowrap justify-end gap-xs">
          {props.picker}
          {props.answering ? (
            <Button
              type="button"
              variant="primary"
              size="icon"
              aria-label="Parar"
              className={ROUND}
              onClick={props.onStop}
            >
              <SquareIcon aria-hidden="true" className="fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="icon"
              aria-label="Enviar"
              className={ROUND}
              disabled={empty || !props.canSend}
            >
              <ArrowUpIcon aria-hidden="true" />
            </Button>
          )}
        </InputGroupAddon>
      </InputGroup>
      {props.memory && <div className="flex items-center px-xs">{props.memory}</div>}
      <p className="text-center text-fact text-text-2">Enter envia · Shift+Enter quebra a linha</p>
      <p className="text-center text-fact text-text-2">
        Não cole senhas, chaves ou tokens na conversa.
      </p>
    </form>
  )
}
