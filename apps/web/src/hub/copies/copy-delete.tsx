import type { CompanyId, CopySummary } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { HubFailure, sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { FieldError } from '../../ui/field.tsx'
import { sendCopyDelete } from './queries.ts'
import {
  DELETE_RESTART,
  deletedTableLeftText,
  deleteProjectText,
  deleteRowsText,
  UNCONFIRMED_DELETE,
} from './text.ts'

/** The company's database silent answers before anything changed (the Hub takes the apps' read first), so its sentence is true. */
function deleteFailureText(error: unknown): string {
  if (error instanceof HubFailure && error.code === 'COPY_DATABASE_UNAVAILABLE')
    return sentenceOf(error)
  return writeFailureText(error, UNCONFIRMED_DELETE)
}

/**
 * **Apagar** a copy: says first what leaves (its rows, each Projeto whose app stops reading it, and
 * that turning it on again copies everything from zero) and waits for the Hub's answer. The cache is
 * read again only when the dialog ends, so a table the company's database did not drop is read
 * before the copy leaves the list; `onDeleted` is the screen's own way back (the detail goes to the
 * list).
 */
export function CopyDeleteDialog(props: {
  companyId: CompanyId
  copy: CopySummary
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}) {
  const { companyId, copy } = props
  const send = useMutation(sendCopyDelete)
  const queryClient = useQueryClient()
  const [kept, setKept] = useState<string[] | undefined>()

  function finish() {
    props.onDeleted()
    void queryClient.invalidateQueries()
  }

  function changeOpen(next: boolean) {
    if (!next) {
      send.reset()
      if (kept !== undefined) finish()
    }
    props.onOpenChange(next)
  }

  function remove() {
    send.mutate(
      { params: { companyId, copyId: copy.id } },
      {
        onSuccess: ({ tablesLeft }) => {
          if (tablesLeft.length === 0) {
            props.onOpenChange(false)
            finish()
          } else setKept(tablesLeft.map(deletedTableLeftText))
        },
        // The Hub may have acted: the list is read again to show what is true.
        onError: () => void queryClient.invalidateQueries(),
      },
    )
  }

  return (
    <AlertDialog open={props.open} onOpenChange={changeOpen}>
      <AlertDialogContent
        title={`Apagar a cópia ${copy.label}?`}
        description={deleteRowsText(copy.rows)}
      >
        {kept === undefined ? (
          <ul aria-label="O que deixa de funcionar" className="flex min-w-0 flex-col gap-xs">
            {copy.projects.map((project) => (
              <li key={project.id} className="break-words">
                {deleteProjectText(project.name)}
              </li>
            ))}
            <li>{DELETE_RESTART}</li>
          </ul>
        ) : (
          kept.map((text) => (
            <p key={text} role="status" className="break-words">
              {text}
            </p>
          ))
        )}
        <FieldError>{send.isError ? deleteFailureText(send.error) : undefined}</FieldError>
        {kept === undefined ? (
          <div className="flex flex-wrap gap-md">
            <Button variant="danger-confirm" disabled={send.isPending} onClick={remove}>
              {send.isPending ? 'Apagando…' : 'Apagar'}
            </Button>
            <Button disabled={send.isPending} onClick={() => changeOpen(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button onClick={() => changeOpen(false)}>Fechar</Button>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
