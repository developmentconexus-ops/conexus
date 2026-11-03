import type { AssistantConversationSummary, CompanyId } from '@conexus/hub-api'
import { CONVERSATION_TITLE_MAX } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { MoreVerticalIcon } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
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
  allAssistantConversationsKey,
  assistantConversationQuery,
  sendAssistantDeletion,
  sendAssistantRename,
} from './queries.ts'
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
  titleOf,
  UNCONFIRMED_WRITE,
} from './text.ts'

type Props = { companyId: CompanyId; conversation: AssistantConversationSummary }

function RenameForm(props: Props & { onDone: () => void }) {
  const { companyId, conversation } = props
  const queryClient = useQueryClient()
  const send = useMutation(sendAssistantRename)
  const form = useSchemaForm(
    z.object({ title: z.string().trim().min(1, 'Escreva um título.').max(CONVERSATION_TITLE_MAX) }),
    { title: titleOf(conversation) },
  )
  async function submit({ title }: { title: string }) {
    try {
      await send.mutateAsync({
        params: { companyId, conversationId: conversation.id },
        body: { title },
      })
    } catch (error) {
      if (error instanceof HubFailure && error.code === 'CONVERSATION_NOT_FOUND') {
        await queryClient.invalidateQueries({ queryKey: allAssistantConversationsKey(companyId) })
        props.onDone()
        return
      }
      setWriteError(form, error, UNCONFIRMED_WRITE)
      return
    }
    await queryClient.invalidateQueries({ queryKey: allAssistantConversationsKey(companyId) })
    await queryClient.invalidateQueries({
      queryKey: assistantConversationQuery(companyId, conversation.id).queryKey,
    })
    props.onDone()
  }
  return (
    <Form form={form} onSubmit={submit}>
      <TextField name="title" label={RENAME_LABEL} type="text" autoComplete="off" />
      <FormAlert />
      <SubmitButton idle={RENAME_SAVE} pending="Salvando…" />
      <Button type="button" onClick={props.onDone}>
        {CANCEL}
      </Button>
    </Form>
  )
}

function DeleteConfirm(props: Props & { onDone: () => void }) {
  const { companyId, conversation } = props
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const openId = useParams({ strict: false, select: (params) => params.conversationId })
  const send = useMutation(sendAssistantDeletion)
  const [refusal, setRefusal] = useState<string>()
  // Deleted now or before ("já foi"): the row leaves the list, and the open one goes to a new one.
  async function leave() {
    await queryClient.invalidateQueries({
      queryKey: allAssistantConversationsKey(companyId),
      refetchType: 'all',
    })
    if (openId === conversation.id) {
      await navigate({ to: '/companies/$companyId', params: { companyId } })
    }
    props.onDone()
  }
  async function confirm() {
    try {
      await send.mutateAsync({ params: { companyId, conversationId: conversation.id } })
    } catch (error) {
      if (error instanceof HubFailure && error.code === 'CONVERSATION_NOT_FOUND') {
        await leave()
        return
      }
      setRefusal(writeFailureText(error, UNCONFIRMED_WRITE))
      return
    }
    await leave()
  }
  return (
    <>
      {refusal !== undefined && <Alert tone="danger">{refusal}</Alert>}
      <Button type="button" variant="danger-confirm" disabled={send.isPending} onClick={confirm}>
        {send.isPending ? 'Apagando…' : DELETE_CONFIRM}
      </Button>
      <Button type="button" disabled={send.isPending} onClick={props.onDone}>
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
              size="icon"
              aria-label={`${CONVERSATION_MENU}: ${titleOf(props.conversation)}`}
              className="absolute top-1/2 right-xs size-6 -translate-y-1/2 bg-surface-3 opacity-0 group-hover/menu-item:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100"
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
        <AlertDialogContent title={DELETE_TITLE} description={DELETE_TEXT}>
          <DeleteConfirm {...props} onDone={close} />
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
