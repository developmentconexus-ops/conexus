import { CONVERSATION_TITLE_MAX, renameAssistantConversation } from '@conexus/hub-api'
import { MoreVerticalIcon } from 'lucide-react'
import type { RefObject } from 'react'
import { useRef, useState } from 'react'
import { HubFailure, writeFailureText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent } from '../../ui/dialog.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setWriteError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import {
  CANCEL,
  CONVERSATION_MENU,
  DELETE,
  DELETE_CONFIRM,
  DELETE_TEXT,
  DELETE_TITLE,
  RENAME,
  RENAME_LABEL,
  RENAME_SAVE,
  RENAME_TITLE,
  UNCONFIRMED_WRITE,
} from './text.ts'

/** What a list lets the person do to a conversation: each item of the menu exists only where its action does. */
export type ConversationActions = {
  rename?: (title: string) => Promise<void>
  remove?: () => Promise<void>
}

/** "Já foi": the Hub no longer holds the conversation, which is what the person wanted. */
function isGone(error: unknown) {
  return error instanceof HubFailure && error.code === 'CONVERSATION_NOT_FOUND'
}

function RenameForm(props: {
  title: string
  rename: (title: string) => Promise<void>
  onDone: () => void
}) {
  const form = useSchemaForm(renameAssistantConversation.input.body, { title: props.title })
  async function submit({ title }: { title: string }) {
    try {
      await props.rename(title)
    } catch (error) {
      if (isGone(error)) {
        props.onDone()
        return
      }
      setWriteError(form, error, UNCONFIRMED_WRITE)
      return
    }
    props.onDone()
  }
  return (
    <Form form={form} onSubmit={submit}>
      <TextField
        name="title"
        label={RENAME_LABEL}
        type="text"
        autoComplete="off"
        invalid={`Escreva um título, com até ${CONVERSATION_TITLE_MAX} caracteres.`}
      />
      <FormAlert />
      <SubmitButton idle={RENAME_SAVE} pending="Salvando…" />
      <Button type="button" onClick={props.onDone}>
        {CANCEL}
      </Button>
    </Form>
  )
}

function DeleteConfirm(props: {
  remove: () => Promise<void>
  onDone: () => void
  cancelRef: RefObject<HTMLButtonElement | null>
}) {
  const [pending, setPending] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  async function confirm() {
    setPending(true)
    try {
      await props.remove()
      props.onDone()
    } catch (error) {
      if (isGone(error)) props.onDone()
      else setRefusal(writeFailureText(error, UNCONFIRMED_WRITE))
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      {refusal !== undefined && <Alert tone="danger">{refusal}</Alert>}
      <Button type="button" variant="danger-confirm" disabled={pending} onClick={confirm}>
        {pending ? 'Apagando…' : DELETE_CONFIRM}
      </Button>
      <Button ref={props.cancelRef} type="button" disabled={pending} onClick={props.onDone}>
        {CANCEL}
      </Button>
    </>
  )
}

/**
 * The "⋮" of a conversation's row, Renomear and Apagar (step 24.3.3, U1), each only where the list
 * gives its action. It shows on hover and focus, and always on a touch screen, where there is no
 * hover. Apagar is a two-button confirmation; closing it while it deletes does not undo it.
 */
export function ConversationMenu(props: { title: string; actions: ConversationActions }) {
  const { rename, remove } = props.actions
  const [shown, setShown] = useState<'RENAME' | 'DELETE' | undefined>()
  const cancelRef = useRef<HTMLButtonElement>(null)
  function close() {
    setShown(undefined)
  }
  if (rename === undefined && remove === undefined) return null
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${CONVERSATION_MENU}: ${props.title}`}
              className="absolute top-1/2 right-xs -translate-y-1/2 bg-surface-3 opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100"
            />
          }
        >
          <MoreVerticalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {rename !== undefined && (
            <DropdownMenuItem onClick={() => setShown('RENAME')}>{RENAME}</DropdownMenuItem>
          )}
          {remove !== undefined && (
            <DropdownMenuItem onClick={() => setShown('DELETE')}>{DELETE}</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {rename !== undefined && (
        <Dialog open={shown === 'RENAME'} onOpenChange={(open) => !open && close()}>
          <DialogContent title={RENAME_TITLE}>
            <RenameForm title={props.title} rename={rename} onDone={close} />
          </DialogContent>
        </Dialog>
      )}
      {remove !== undefined && (
        <AlertDialog open={shown === 'DELETE'} onOpenChange={(open) => !open && close()}>
          <AlertDialogContent
            title={DELETE_TITLE}
            description={DELETE_TEXT}
            initialFocus={cancelRef}
          >
            <DeleteConfirm remove={remove} onDone={close} cancelRef={cancelRef} />
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
