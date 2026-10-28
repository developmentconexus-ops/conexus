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
/** Takes the files and says why any was left out. */
type AddFiles = (picked: readonly File[]) => void

/** The draft's files, each a chip with an **x** that takes it out. */
function Attached(props: { attachments: Attachments; onRemove: (index: number) => void }) {
  const { attachments } = props
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
                onClick={() => props.onRemove(index)}
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
function droppedOn(add: AddFiles) {
  return {
    onPaste: (event: ClipboardEvent<HTMLFormElement>) => {
      if (event.clipboardData.files.length === 0) return
      event.preventDefault()
      add(Array.from(event.clipboardData.files))
    },
    onDragOver: (event: DragEvent<HTMLFormElement>) => event.preventDefault(),
    onDrop: (event: DragEvent<HTMLFormElement>) => {
      event.preventDefault()
      add(Array.from(event.dataTransfer.files))
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

/** The model button's round, soft fill, on the controls beside it (the card, row "O + e o microfone"). */
const SOFT = 'rounded-full bg-surface-3 hover:bg-accent-soft'

/** **+**: the browser's file picker, limited to the types the Builder reads. */
function Attach({ add }: { add: AddFiles }) {
  const picker = useRef<HTMLInputElement>(null)
  return (
    <>
      <InputGroupButton
        className={SOFT}
        aria-label="Anexar arquivos"
        onClick={() => picker.current?.click()}
      >
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
          add(picked)
        }}
      />
    </>
  )
}

/**
 * The one phrase above the box, of whatever happened last: a file left out or the microphone
 * stopping. A new one takes the place of the one before.
 */
function usePhrase(attachments: Attachments) {
  const [phrase, setPhrase] = useState<string | null>(null)
  return {
    phrase,
    setPhrase,
    removeFile: (index: number) => {
      attachments.remove(index)
      setPhrase(null)
    },
    addFiles: (picked: readonly File[]) =>
      void attachments.add(picked).then((refused) => setPhrase(refused && REFUSALS[refused])),
  }
}

/**
 * The microphone and what it adds to the box: the phrase in progress shown after the draft, which
 * reads only until it is final, and then joined to the draft once.
 */
function useDictation(draft: Draft, setPhrase: (phrase: string | null) => void) {
  const [interim, setInterim] = useState('')
  return {
    shown: joined(draft.text, interim),
    listening: interim !== '',
    mic: (
      <SpeechInput
        lang="pt-BR"
        className={SOFT}
        onFinal={(text) => {
          setPhrase(null)
          draft.change(joined(draft.text, text))
        }}
        onInterim={setInterim}
        onError={(error) => setPhrase(dictationText(error))}
      />
    ),
  }
}

/**
 * The field and its action row, at every width: on the left **+**, the model's button and the memory
 * ring, and on the right the microphone and the round button, which is **Parar** while the Builder
 * answers and the box is empty, and **Enviar** otherwise (founder, 2026-10-27: **+** first, as AI
 * Elements' `PromptInputTools` puts the attachments action, then the model and the ring after it). The row never wraps down to 320 px: the
 * left takes the free width and the model's name truncates in it, the buttons keep theirs
 * (`PromptInputFooter`, `PromptInputSubmit`). Under 20 rem, at 200% zoom on a phone (design V18),
 * there is no room for four 44 px targets and the buttons take a line of their own.
 * Enter sends and Shift+Enter breaks the line, except while an input method is composing a character
 * (design V30); on touch Return breaks the line and only the button sends. While the Builder answers
 * the field stays open: Enter steers the running turn, Esc stops, and focus goes back to the field
 * (design V31). What is typed is kept per conversation, by the draft the screen holds, with the
 * files: picked by **+**, pasted or dropped on the form, each a chip above the text. A send takes
 * text and files out of the box at its start and gives them back if refused. Under the box, on a
 * computer, one small line says not to paste secrets (founder, 2026-10-26).
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
  /** The memory ring, after the model's button on the row's left. */
  memory?: ReactNode
  /** What the empty box says; without it, the conversation's words. */
  placeholder?: string
}) {
  const { draft } = props
  const phone = useIsMobile()
  const attachments = useAttachments(draft)
  const empty = draft.text.trim() === '' && attachments.files.length === 0
  const action: 'stop' | 'send' = props.answering && empty ? 'stop' : 'send'

  const sending = useRef(false)
  const { phrase, setPhrase, addFiles, removeFile } = usePhrase(attachments)
  const dictation = useDictation(draft, setPhrase)

  /** One send at a time: a second Enter or click before the route answers would send it again (Factory clears its field before sending). */
  async function send() {
    if (empty || !props.canSend || sending.current) return
    sending.current = true
    const outgoing = draft.take()
    setPhrase(null)
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
    <form onSubmit={submit} {...droppedOn(addFiles)} className={FORM}>
      {props.taskPanel}
      <Refused phrase={phrase} />
      <InputGroup
        data-busy={props.answering || undefined}
        className="rounded-composer data-busy:working-ring"
      >
        <Label htmlFor="message" className="sr-only">
          Mensagem para o Builder
        </Label>
        <Attached attachments={attachments} onRemove={removeFile} />
        <InputGroupTextarea
          id="message"
          ref={props.field}
          value={dictation.shown}
          placeholder={
            props.answering ? STEER_PLACEHOLDER : (props.placeholder ?? 'Escreva sua mensagem')
          }
          readOnly={dictation.listening}
          onChange={(event) => draft.change(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <InputGroupAddon
          align="block-end"
          className="flex-nowrap items-center justify-between gap-xs pointer-coarse:gap-sm max-[20rem]:flex-wrap"
        >
          <div className="flex min-w-0 flex-1 items-center gap-sm max-[20rem]:basis-full">
            <Attach add={addFiles} />
            {props.picker}
            {props.memory}
          </div>
          <div className="flex shrink-0 items-center gap-xs pointer-coarse:gap-md">
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
          </div>
        </InputGroupAddon>
      </InputGroup>
      {!phone && <p className="text-center text-fact text-text-2">{NO_SECRETS}</p>}
    </form>
  )
}
