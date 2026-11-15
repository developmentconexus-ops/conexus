import type { CompanyId, CompanyMemoryNote, CompanyMemoryPage } from '@conexus/hub-api'
import { writeCompanyMemoryNote, writeCompanyMemoryPage } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'
import { ActionDialog, isGone } from '../../hub/identity/public.ts'
import { dayOf } from '../../platform/dates.ts'
import { HubFailure, unconfirmedText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setWriteError,
  TextField,
  useFieldError,
  useSchemaForm,
} from '../../ui/form.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Textarea } from '../../ui/textarea.tsx'
import {
  companyMemoryPageQuery,
  sendCompanyMemoryNote,
  sendCompanyMemoryNoteRemoval,
  sendCompanyMemoryPage,
  sendCompanyMemoryPageRemoval,
} from './queries.ts'

export const READ_FAILED = 'Não foi possível ler a memória da empresa.'
const GONE = 'Esta página não existe mais.'
/** A save refused because someone changed the page meanwhile; the table's phrase is the removal's. */
const CHANGED_SAVING = 'A página mudou enquanto você salvava.'
const UNSAVED = unconfirmedText('se a página foi salva', 'Confira o texto e tente de novo.')
const UNSAVED_NOTE = unconfirmedText('se a nota foi salva', 'Confira o texto e tente de novo.')

/** Who wrote last and when, as "Ana · 11/11/2026"; with no name to give (the Hub does not know the person), only the day: the model writes nothing here (B1). */
export function bylineOf(item: { author: string | null; updatedAt: string }): string {
  const day = dayOf(item.updatedAt)
  return item.author === null ? day : `${item.author} · ${day}`
}

/** A text box of a form, with its label, its refusal and, given `max`, the count against it. */
export function TextBox(props: {
  name: string
  label: string
  /** Given, the box is named by this element, a section's title, and draws no label of its own. */
  labelledBy?: string
  max?: number
  invalid?: string
  readOnly?: boolean
}) {
  const { register, watch } = useFormContext()
  const shown = useFieldError(props.name, props.invalid)
  const length = String(watch(props.name) ?? '').length
  return (
    <Field {...shown.field}>
      {props.labelledBy === undefined && <FieldLabel htmlFor={shown.id}>{props.label}</FieldLabel>}
      <Textarea
        id={shown.id}
        aria-labelledby={props.labelledBy}
        className="min-h-24 max-h-96"
        readOnly={props.readOnly}
        {...shown.control}
        {...register(props.name)}
      />
      <div className="flex flex-wrap justify-between gap-sm">
        <FieldError id={shown.errorId}>{shown.message}</FieldError>
        {props.max !== undefined && (
          <p className="ms-auto text-label text-text-2 tabular-nums">
            {length.toLocaleString('pt-BR')} / {props.max.toLocaleString('pt-BR')}
          </p>
        )}
      </div>
    </Field>
  )
}

/** What a failed save leaves on the form: the conflict in a save's words, any other as the table says. */
function refused(
  form: UseFormReturn<{ name: string; body: string }, unknown, { name: string; body: string }>,
  error: unknown,
  unconfirmed: string,
) {
  if (error instanceof HubFailure && error.code === 'COMPANY_MEMORY_CHANGED') {
    form.setError('root.server', { type: 'server', message: CHANGED_SAVING })
  } else setWriteError(form, error, unconfirmed)
}

const PageFields = writeCompanyMemoryPage.input.body.omit({ version: true })

function PageEditor(props: { companyId: CompanyId; page: CompanyMemoryPage; done: () => void }) {
  const { page } = props
  const send = useMutation(sendCompanyMemoryPage)
  const form = useSchemaForm(PageFields, { name: page.name, body: page.body })
  async function submit(body: { name: string; body: string }) {
    try {
      const params = { companyId: props.companyId, pageId: page.pageId }
      await send.mutateAsync({ params, body: { ...body, version: page.version } })
      props.done()
    } catch (error) {
      refused(form, error, UNSAVED)
    }
  }
  return (
    <Form form={form} onSubmit={submit}>
      <TextField name="name" label="Nome" type="text" autoComplete="off" />
      <TextBox name="body" label="Texto" />
      <FormAlert />
      <div className="flex flex-wrap gap-sm">
        <SubmitButton idle="Salvar" pending="Salvando…" label={`Salvar ${page.name}`} />
        <Button type="button" onClick={props.done}>
          Cancelar
        </Button>
      </div>
    </Form>
  )
}

function NoteEditor(props: { companyId: CompanyId; note: CompanyMemoryNote; done: () => void }) {
  const send = useMutation(sendCompanyMemoryNote)
  const form = useSchemaForm(writeCompanyMemoryNote.input.body, { body: props.note.body })
  async function submit(body: { body: string }) {
    try {
      await send.mutateAsync({
        params: { companyId: props.companyId, noteId: props.note.id },
        body,
      })
      props.done()
    } catch (error) {
      setWriteError(form, error, UNSAVED_NOTE)
    }
  }
  return (
    <Form form={form} onSubmit={submit}>
      <TextBox name="body" label="Nota" />
      <FormAlert />
      <div className="flex flex-wrap gap-sm">
        <SubmitButton idle="Salvar" pending="Salvando…" label="Salvar a nota" />
        <Button type="button" onClick={props.done}>
          Cancelar
        </Button>
      </div>
    </Form>
  )
}

/** A removal, confirmed: the dialog closes when it is done or when the Hub no longer knows the item. */
function Removal(props: {
  what: string
  title: string
  description: string
  remove: (done: { onSuccess: () => void; onError: (error: unknown) => void }) => void
  write: Parameters<typeof ActionDialog>[0]['write']
}) {
  const [open, setOpen] = useState(false)
  const close = {
    onSuccess: () => setOpen(false),
    onError: (e: unknown) => isGone(e) && setOpen(false),
  }
  return (
    <ActionDialog
      open={open}
      onOpenChange={setOpen}
      trigger={{ label: 'Apagar', name: `Apagar ${props.what}`, danger: true }}
      title={props.title}
      description={props.description}
      confirm={{ label: 'Apagar', pending: 'Apagando…' }}
      write={props.write}
      onConfirm={() => props.remove(close)}
    />
  )
}

function Note(props: { companyId: CompanyId; note: CompanyMemoryNote; may: boolean }) {
  const { companyId, note } = props
  const [editing, setEditing] = useState(false)
  const remove = useMutation(sendCompanyMemoryNoteRemoval)
  if (editing)
    return <NoteEditor companyId={companyId} note={note} done={() => setEditing(false)} />
  return (
    <li className="flex flex-col gap-xs">
      <p className="whitespace-pre-wrap">{note.body}</p>
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <p className="text-label text-text-2">{bylineOf(note)}</p>
        {props.may && (
          <div className="flex flex-wrap gap-sm">
            <Button
              size="sm"
              aria-label={`Corrigir a nota: ${note.body}`}
              onClick={() => setEditing(true)}
            >
              Corrigir
            </Button>
            <Removal
              what={`a nota: ${note.body}`}
              title="Apagar esta nota?"
              description="O Assistente deixa de ler esta nota nas conversas da empresa."
              write={remove}
              remove={(close) => remove.mutate({ params: { companyId, noteId: note.id } }, close)}
            />
          </div>
        )}
      </div>
    </li>
  )
}

function Shown(props: { companyId: CompanyId; page: CompanyMemoryPage; may: boolean }) {
  const { companyId, page } = props
  const [editing, setEditing] = useState(false)
  const remove = useMutation(sendCompanyMemoryPageRemoval)
  if (editing)
    return <PageEditor companyId={companyId} page={page} done={() => setEditing(false)} />
  const params = { companyId, pageId: page.pageId }
  return (
    <div className="flex flex-col gap-md">
      {page.body !== '' && <p className="whitespace-pre-wrap">{page.body}</p>}
      {page.notes.length > 0 && (
        <ul
          aria-label={`Notas de ${page.name}`}
          className="flex flex-col gap-md border-line border-s-2 ps-md"
        >
          {page.notes.map((note) => (
            <Note key={note.id} companyId={companyId} note={note} may={props.may} />
          ))}
        </ul>
      )}
      {props.may && (
        <div className="flex flex-wrap gap-sm">
          <Button size="sm" aria-label={`Editar ${page.name}`} onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Removal
            what={page.name}
            title={`Apagar a página ${page.name}?`}
            description="O Assistente deixa de ler esta página e as notas dela nas conversas da empresa."
            write={remove}
            remove={(close) => remove.mutate({ params, query: { version: page.version } }, close)}
          />
        </div>
      )}
    </div>
  )
}

/** A page of the company opened under its row: its text and notes, read when it opens. */
export function PageDetail(props: {
  companyId: CompanyId
  page: { pageId: CompanyMemoryPage['pageId'] }
  may: boolean
}) {
  const read = useQuery(companyMemoryPageQuery(props.companyId, props.page.pageId))
  if (read.isPending) {
    return (
      <div role="status" aria-label="Carregando" className="flex flex-col gap-sm">
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }
  if (read.isError) {
    return isGone(read.error) ? (
      <Alert tone="danger">{GONE}</Alert>
    ) : (
      <ReadFailure text={READ_FAILED} onRetry={() => void read.refetch()} />
    )
  }
  return <Shown companyId={props.companyId} page={read.data.page} may={props.may} />
}
