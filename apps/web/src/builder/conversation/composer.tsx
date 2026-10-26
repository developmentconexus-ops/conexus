import { ArrowUpIcon, PlusIcon, SquareIcon, XIcon } from 'lucide-react'
import type { ClipboardEvent, DragEvent, KeyboardEvent, ReactNode, Ref, SubmitEvent } from 'react'
import { useRef, useState } from 'react'
import { AttachmentAction, AttachmentGroup } from '../../ui/attachment.tsx'
import { Button } from '../../ui/button.tsx'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '../../ui/input-group.tsx'
import { Label } from '../../ui/label.tsx'
import { SpeechInput } from '../../ui/speech-input.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import type { Outgoing } from './attachments.ts'
import { ACCEPT, useAttachments } from './attachments.ts'
import type { Draft } from './draft.ts'
import { chipOf } from './messages.ts'
import { FileChip } from './person-turn.tsx'
import { dictationText, NO_SECRETS, REFUSALS, STEER_PLACEHOLDER } from './text.ts'

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

/** Why a file was left out, or why the microphone stopped, above the box. */
function Refused({ phrase }: { phrase: string | null }) {
  if (phrase === null) return null
  return (
    <p role="alert" className="text-fact text-danger">
      {phrase}
    </p>
  )
}

/** The words joined to what is in the box, a space between them unless the box ends in one. */
function joined(text: string, added: string): string {
  if (added === '') return text
  return text === '' || /\s$/.test(text) ? text + added.trimStart() : `${text} ${added.trimStart()}`
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
 * The one phrase above the box, the one of whatever happened last: a file left out or the
 * microphone stopping. A dictation error takes the refusal's place, and a new refusal takes the error's.
 */
function useNotice(attachments: Attachments) {
  const [phrase, setPhrase] = useState<string | null>(null)
  const [refusal, setRefusal] = useState(attachments.refusal)
  if (refusal !== attachments.refusal) {
    setRefusal(attachments.refusal)
    setPhrase(attachments.refusal === null ? null : REFUSALS[attachments.refusal])
  }
  return {
    phrase,
    clear: () => setPhrase(null),
    say: (said: string) => {
      setPhrase(said)
      setRefusal(null)
      attachments.clearRefusal()
    },
  }
}

/**
 * The microphone and what it adds to the box: the phrase in progress shown after the draft, which
 * reads only until it is final, and then joined to the draft once.
 */
function useDictation(draft: Draft, notice: ReturnType<typeof useNotice>) {
  const [interim, setInterim] = useState('')
  return {
    shown: joined(draft.text, interim),
    listening: interim !== '',
    mic: (
      <SpeechInput
        lang="pt-BR"
        onFinal={(text) => {
          notice.clear()
          draft.change(joined(draft.text, text))
        }}
        onInterim={setInterim}
        onError={(error) => notice.say(dictationText(error))}
      />
    ),
  }
}

/**
 * The field and its one button, in a single row of actions at every width: **+**, the microphone and
 * the round button at the end, which is **Parar** while the Builder answers and the box is empty,
 * and **Enviar** otherwise. Under the box, one strip: the status line with the memory ring and the
 * model's button, wrapping when narrow (Factory's `StatusLine`), and on a computer the secrets line. Enter sends and Shift+Enter breaks the line, except
 * while an input method is composing a character (design V30); on touch Return breaks the line and
 * only the button sends. While the Builder answers the field stays open: Enter steers the running
 * turn, Esc stops, and focus goes back to the field (design V31). What is typed is kept per
 * conversation, by the draft the screen holds, with the files: picked by **+**, pasted or dropped on
 * the form, each a chip above the text. A send takes text and files out of the box at its start and
 * gives them back if refused. The small line says not to paste secrets (founder, 2026-10-26).
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
  /** The memory ring, the first of the status line under the box. */
  memory?: ReactNode
}) {
  const { draft } = props
  const phone = useIsMobile()
  const attachments = useAttachments(draft)
  const empty = draft.text.trim() === '' && attachments.files.length === 0
  const action: 'stop' | 'send' = props.answering && empty ? 'stop' : 'send'

  const sending = useRef(false)
  const notice = useNotice(attachments)
  const dictation = useDictation(draft, notice)

  /** One send at a time: a second Enter or click before the route answers would send it again (Factory clears its field before sending). */
  async function send() {
    if (empty || !props.canSend || sending.current) return
    sending.current = true
    const outgoing = draft.take()
    attachments.clearRefusal()
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
      <Refused phrase={notice.phrase} />
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
          value={dictation.shown}
          placeholder={props.answering ? STEER_PLACEHOLDER : 'Escreva sua mensagem'}
          readOnly={dictation.listening}
          onChange={(event) => draft.change(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <InputGroupAddon align="block-end" className="flex-nowrap justify-end gap-xs">
          <Attach attachments={attachments} />
          {dictation.mic}
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
      <div className="flex flex-col gap-xs">
        <div className="flex flex-wrap items-center gap-x-sm gap-y-xs">
          {props.memory}
          {props.picker}
        </div>
        {!phone && <p className="text-center text-fact text-text-2">{NO_SECRETS}</p>}
      </div>
    </form>
  )
}
