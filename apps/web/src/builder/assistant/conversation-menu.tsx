import type { AssistantConversationSummary, CompanyId } from '@conexus/hub-api'
import { CONVERSATION_TITLE_MAX, renameAssistantConversation } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
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
import { titleOf } from '../conversation/public.ts'
import { sendAssistantDeletion, sendAssistantRename } from './queries.ts'
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

/** "Já foi": the Hub no longer holds the conversation, which is what the person wanted. */
function isGone(error: unknown) {
  return error instanceof HubFailure && error.code === 'CONVERSATION_NOT_FOUND'
}

type Props = { companyId: CompanyId; conversation: AssistantConversationSummary }

function RenameForm(props: Props & { onDone: () => void }) {
  const { companyId, conversation } = props
  const send = useMutation(sendAssistantRename)
  const form = useSchemaForm(renameAssistantConversation.input.body, {
    title: titleOf(conversation),
  })
  async function submit({ title }: { title: string }) {
    try {
      await send.mutateAsync({
        params: { companyId, conversationId: conversation.id },
        body: { title },
      })
    } catch (error) {
      if (error instanceof HubFailure && error.code === 'CONVERSATION_NOT_FOUND') {
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

function DeleteConfirm(
  props: Props & { onDone: () => void; cancelRef: RefObject<HTMLButtonElement | null> },
) {
  const { companyId, conversation } = props
  const navigate = useNavigate()
  const openId = useParams({ strict: false, select: (params) => params.conversationId })
  const [refusal, setRefusal] = useState<string>()
  // The open conversation goes to a new one before the cache refreshes: the mutation's own
  // `onSuccess` runs ahead of the cache's `onSettled`, whose reload would show the deleted one "not found".
  function leave() {
    props.onDone()
    if (openId === conversation.id) {
      return navigate({ to: '/companies/$companyId', params: { companyId } })
    }
    return undefined
  }
  const send = useMutation({
    ...sendAssistantDeletion,
    onSuccess: leave,
    onError: (error) => (isGone(error) ? leave() : undefined),
  })
  async function confirm() {
    try {
      await send.mutateAsync({ params: { companyId, conversationId: conversation.id } })
    } catch (error) {
      if (!isGone(error)) setRefusal(writeFailureText(error, UNCONFIRMED_WRITE))
    }
  }
  return (
    <>
      {refusal !== undefined && <Alert tone="danger">{refusal}</Alert>}
      <Button type="button" variant="danger-confirm" disabled={send.isPending} onClick={confirm}>
        {send.isPending ? 'Apagando…' : DELETE_CONFIRM}
      </Button>
      <Button ref={props.cancelRef} type="button" disabled={send.isPending} onClick={props.onDone}>
        {CANCEL}
      </Button>
    </>
  )
}

/**
 * The "⋮" of a conversation's row, Renomear and Apagar (step 24.3.3, U1). It shows on hover and
 * focus, and always on a touch screen, where there is no hover. Apagar is a two-button
 * confirmation; closing it while it deletes does not undo it.
 */
export function ConversationMenu(props: Props) {
  const [shown, setShown] = useState<'RENAME' | 'DELETE' | undefined>()
  const cancelRef = useRef<HTMLButtonElement>(null)
  function close() {
    setShown(undefined)
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${CONVERSATION_MENU}: ${titleOf(props.conversation)}`}
              className="absolute top-1/2 right-xs -translate-y-1/2 bg-surface-3 opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100"
            />
          }
        >
          <MoreVerticalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setShown('RENAME')}>{RENAME}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShown('DELETE')}>{DELETE}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={shown === 'RENAME'} onOpenChange={(open) => !open && close()}>
        <DialogContent title={RENAME_TITLE}>
          <RenameForm {...props} onDone={close} />
        </DialogContent>
      </Dialog>
      <AlertDialog open={shown === 'DELETE'} onOpenChange={(open) => !open && close()}>
        <AlertDialogContent title={DELETE_TITLE} description={DELETE_TEXT} initialFocus={cancelRef}>
          <DeleteConfirm {...props} onDone={close} cancelRef={cancelRef} />
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
