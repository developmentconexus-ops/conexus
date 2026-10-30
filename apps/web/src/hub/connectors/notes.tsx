import type { CompanyId, ConnectionId, ConnectionNote } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { SectionTitle } from '../../ui/list.tsx'
import { Empty } from '../../ui/states.tsx'
import { ActionDialog, isGone } from '../identity/public.ts'
import { connectionKeys, sendNoteDeletion } from './queries.ts'
import { EMPTY_NOTEBOOK, ERASE, NOTEBOOK, provedText } from './text.ts'

function Entry(props: {
  companyId: CompanyId
  connectionId: ConnectionId
  note: ConnectionNote
  mayManage: boolean
}) {
  const { companyId, connectionId, note } = props
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const erase = useMutation({
    ...sendNoteDeletion,
    onSettled: () => {
      for (const queryKey of connectionKeys(companyId, connectionId)) {
        void queryClient.invalidateQueries({ queryKey })
      }
    },
  })
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-md gap-y-sm border-b border-line px-sm py-md last:border-b-0">
      <span className="flex min-w-0 flex-col gap-xs">
        <span className="wrap-anywhere font-medium">{note.concept}</span>
        <code className="wrap-anywhere font-mono text-fact">{note.mapping}</code>
        <span className="text-label text-text-2">{provedText(note)}</span>
      </span>
      {props.mayManage && (
        <ActionDialog
          open={open}
          onOpenChange={setOpen}
          trigger={{ label: ERASE, name: `${ERASE}: ${note.concept}`, danger: true }}
          title={`Apagar a anotação "${note.concept}"?`}
          description="O Builder deixa de usar essa anotação. Ele pode anotar de novo."
          confirm={{ label: ERASE, pending: 'Apagando…' }}
          write={erase}
          onConfirm={() =>
            erase.mutate(
              { params: { companyId, connectionId, concept: note.concept } },
              { onSuccess: () => setOpen(false), onError: (e) => isGone(e) && setOpen(false) },
            )
          }
        />
      )}
    </li>
  )
}

/** The Builder's notebook of a connection: what it proved about the system's names, never a value. The owner and the administrators erase an entry (`mayManage`); a member reads. */
export function Notebook(props: {
  companyId: CompanyId
  connectionId: ConnectionId
  notes: readonly ConnectionNote[]
  mayManage: boolean
}) {
  return (
    <section aria-label={NOTEBOOK} className="flex flex-col gap-md">
      <SectionTitle>{NOTEBOOK}</SectionTitle>
      {props.notes.length === 0 ? (
        <Empty>{EMPTY_NOTEBOOK}</Empty>
      ) : (
        <ul className="flex flex-col border-y border-line">
          {props.notes.map((note) => (
            <Entry
              key={note.concept}
              companyId={props.companyId}
              connectionId={props.connectionId}
              note={note}
              mayManage={props.mayManage}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
