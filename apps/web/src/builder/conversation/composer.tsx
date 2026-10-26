import { ArrowUpIcon, PlusIcon, SquareIcon, XIcon } from 'lucide-react'
import type { ClipboardEvent, DragEvent, KeyboardEvent, ReactNode, Ref, SubmitEvent } from 'react'
import { useRef } from 'react'
import { AttachmentAction, AttachmentGroup } from '../../ui/attachment.tsx'
import { Button } from '../../ui/button.tsx'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '../../ui/input-group.tsx'
import { Label } from '../../ui/label.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import type { Outgoing, Refusal } from './attachments.ts'
import { ACCEPT, useAttachments } from './attachments.ts'
import type { Draft } from './draft.ts'
import { chipOf } from './messages.ts'
import { FileChip } from './person-turn.tsx'
import { NO_SECRETS, REFUSALS, STEER_PLACEHOLDER } from './text.ts'

/** The form sticks to the bottom and clears the home indicator. */
const FORM =
  'sticky bottom-0 flex flex-col gap-xs bg-canvas pb-[max(0.5rem,env(safe-area-inset-bottom))]'

/** A finger's keyboard has a Return that means a new line; the button is what sends. */
function isTouch(): boolean {
  return globalThis.matchMedia('(pointer: coarse)').matches
}

/** The round button at the end of the field: ink at rest, ipê under the pointer (design V5). */
const ROUND =
  'rounded-pill hover:bg-accent disabled:bg-surface-4 disabled:text-text-2 disabled:opacity-100'

type Attachments = ReturnType<typeof useAttachments>

/** The draft's files, each a chip with an **x** that takes it out. */
function Attached({ attachments }: { attachments: Attachments }) {
  if (attachments.files.length === 0) return null
  return (
    <InputGroupAddon align="block-start">
      <AttachmentGroup role="group" aria-label="Arquivos anexados">
        {attachments.files.map((file, index) => (
          <FileChip
            key={file.data}
            file={chipOf(file)}
            action={
              <AttachmentAction
                aria-label={`Tirar ${file.filename}`}
                onClick={() => attachments.remove(index)}
              >
                <XIcon aria-hidden="true" />
              </AttachmentAction>
            }
          />
        ))}
      </AttachmentGroup>
    </InputGroupAddon>
  )
}

/** The form takes files pasted or dropped on it (AI Elements `prompt-input`); pasted words stay words. */
function droppedOn(attachments: Attachments) {
  return {
    onPaste: (event: ClipboardEvent<HTMLFormElement>) => {
      if (event.clipboardData.files.length === 0) return
      event.preventDefault()
      void attachments.add(Array.from(event.clipboardData.files))
    },
    onDragOver: (event: DragEvent<HTMLFormElement>) => event.preventDefault(),
    onDrop: (event: DragEvent<HTMLFormElement>) => {
      event.preventDefault()
      void attachments.add(Array.from(event.dataTransfer.files))
    },
  }
}

/** Why a file was left out, above the box, until the next file added or taken out. */
function Refused({ refusal }: { refusal: Refusal | null }) {
  if (refusal === null) return null
  return (
    <p role="alert" className="text-fact text-danger">
      {REFUSALS[refusal]}
    </p>
  )
}

/** **+**: the browser's file picker, limited to the types the Builder reads. */
function Attach({ attachments }: { attachments: Attachments }) {
  const picker = useRef<HTMLInputElement>(null)
  return (
    <>
      <InputGroupButton aria-label="Anexar arquivos" onClick={() => picker.current?.click()}>
        <PlusIcon aria-hidden="true" />
      </InputGroupButton>
      <input
        ref={picker}
        type="file"
        multiple
        accept={ACCEPT}
        hidden
        onChange={(event) => {
          const picked = Array.from(event.currentTarget.files ?? [])
          event.currentTarget.value = ''
          void attachments.add(picked)
        }}
      />
    </>
  )
}

/**
 * The field and its one button, in a single row of actions at every width: the memory ring, the
 * model's button and the round button at the end, which is **Parar** while the Builder answers and
 * the box is empty, and **Enviar** otherwise. Enter sends and Shift+Enter breaks the line, except
 * while an input method is composing a character (design V30); on touch Return breaks the line and
 * only the button sends. While the Builder answers the field stays open: Enter steers the running
 * turn, Esc stops, and focus goes back to the field (design V31). What is typed is kept per
 * conversation, by the draft the screen holds, with the files: picked by **+**, pasted or dropped on
 * the form, each a chip above the text. A send takes text and files out of the box at its start and
 * gives them back if refused. Under the box, on a computer, one small line says not to paste secrets
 * (founder, 2026-10-26).
 */
export function Composer(props: {
  answering: boolean
  canSend: boolean
  draft: Draft
  field: Ref<HTMLTextAreaElement>
  onSend: (outgoing: Outgoing) => Promise<boolean>
  onStop: () => void
  picker: ReactNode
  taskPanel?: ReactNode
  /** The memory ring, the first of the action row. */
  memory?: ReactNode
}) {
  const { draft } = props
  const phone = useIsMobile()
  const attachments = useAttachments(draft)
  const empty = draft.text.trim() === '' && attachments.files.length === 0
  const action: 'stop' | 'send' = props.answering && empty ? 'stop' : 'send'

  const sending = useRef(false)

  /** One send at a time: a second Enter or click before the route answers would send it again (Factory clears its field before sending). */
  async function send() {
    if (empty || !props.canSend || sending.current) return
    sending.current = true
    const outgoing = draft.take()
    try {
      if (!(await props.onSend(outgoing))) draft.restore(outgoing)
    } finally {
      sending.current = false
    }
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    void send()
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape' && props.answering && !event.nativeEvent.isComposing) {
      event.preventDefault()
      props.onStop()
      return
    }
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || isTouch())
      return
    event.preventDefault()
    void send()
  }

  return (
    <form onSubmit={submit} {...droppedOn(attachments)} className={FORM}>
      {props.taskPanel}
      <Refused refusal={attachments.refusal} />
      <InputGroup
        data-busy={props.answering || undefined}
        className="rounded-composer data-busy:working-ring"
      >
        <Label htmlFor="message" className="sr-only">
          Mensagem para o Builder
        </Label>
        <Attached attachments={attachments} />
        <InputGroupTextarea
          id="message"
          ref={props.field}
          value={draft.text}
          placeholder={props.answering ? STEER_PLACEHOLDER : 'Escreva sua mensagem'}
          onChange={(event) => draft.change(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <InputGroupAddon align="block-end" className="flex-nowrap justify-end gap-xs">
          {props.memory && <div className="me-auto">{props.memory}</div>}
          {props.picker}
          <Attach attachments={attachments} />
          <Button
            type={action === 'stop' ? 'button' : 'submit'}
            variant="primary"
            size="icon"
            aria-label={action === 'stop' ? 'Parar' : 'Enviar'}
            className={ROUND}
            disabled={action === 'send' && (empty || !props.canSend)}
            onClick={action === 'stop' ? props.onStop : undefined}
          >
            {action === 'stop' ? (
              <SquareIcon aria-hidden="true" className="fill-current" />
            ) : (
              <ArrowUpIcon aria-hidden="true" />
            )}
          </Button>
        </InputGroupAddon>
      </InputGroup>
      {!phone && <p className="text-center text-fact text-text-2">{NO_SECRETS}</p>}
    </form>
  )
}
