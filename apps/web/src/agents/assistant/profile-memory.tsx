import type { CompanyId } from '@conexus/hub-api'
import { PROFILE_MEMORY_MAX, setProfileMemory } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ActionDialog, isGone } from '../../hub/identity/public.ts'
import { HubFailure, unconfirmedText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { Field, FieldError } from '../../ui/field.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setWriteError,
  useFieldError,
  useSchemaForm,
} from '../../ui/form.tsx'
import { SettingsSection } from '../../ui/settings-section.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { Textarea } from '../../ui/textarea.tsx'
import { profileMemoryQuery, sendProfileMemory, sendProfileMemoryClear } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/account')

const ID = 'profile-memory'
const TITLE = 'O que o Assistente lembra de você'
const EMPTY =
  'O Assistente ainda não guardou nada sobre você. Ele guarda o que você pedir para lembrar, e o que aprender nas conversas.'
const READ_FAILED = 'Não foi possível ler a memória.'
const MAX = PROFILE_MEMORY_MAX.toLocaleString('pt-BR')
const TOO_LONG = `Escreva até ${MAX} caracteres.`
const UNSAVED = unconfirmedText('se a memória foi salva', 'Confira o texto e tente de novo.')
const UNERASED = unconfirmedText('se a memória foi apagada', 'Confira o texto e tente de novo.')
const ERASE = 'Apagar tudo'

/** A reply the browser could not read whole: the Hub may have written, so the screen reads again. */
function unsettled(error: unknown): boolean {
  return error instanceof HubFailure && error.outcomeUnknown
}

/** "Apagar tudo", confirmed; an answer that does not settle closes the box and the text is read again. */
function EraseAll({ companyId }: { companyId: CompanyId }) {
  const [open, setOpen] = useState(false)
  const erase = useMutation(sendProfileMemoryClear)
  function confirm() {
    erase.mutate(
      { params: { companyId } },
      {
        onSuccess: () => setOpen(false),
        onError: (error) => (isGone(error) || unsettled(error)) && setOpen(false),
      },
    )
  }
  return (
    <div className="flex flex-col items-end gap-sm">
      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        trigger={{ label: ERASE, name: ERASE, danger: true }}
        title="Apagar o que o Assistente lembra de você?"
        description="Ele esquece o texto inteiro. Nas próximas conversas, volta a guardar o que você pedir para lembrar."
        confirm={{ label: ERASE, pending: 'Apagando…' }}
        write={erase}
        onConfirm={confirm}
      />
      {!open && unsettled(erase.error) && <Alert tone="danger">{UNERASED}</Alert>}
    </div>
  )
}

function TextBox() {
  const { register, watch } = useFormContext<{ text: string }>()
  const shown = useFieldError('text', TOO_LONG)
  const length = watch('text').length
  return (
    <Field {...shown.field}>
      <Textarea
        id={shown.id}
        aria-labelledby={`${ID}-title`}
        className="min-h-24 max-h-96"
        {...shown.control}
        {...register('text')}
      />
      <div className="flex flex-wrap justify-between gap-sm">
        <FieldError id={shown.errorId}>{shown.message}</FieldError>
        <p className="ms-auto text-label text-text-2 tabular-nums">
          {length.toLocaleString('pt-BR')} / {MAX}
        </p>
      </div>
    </Field>
  )
}

/** The text and its editor; a new text from the Hub mounts a new editor, so the box shows what stayed. */
function Editor({ companyId, saved }: { companyId: CompanyId; saved: string | null }) {
  const send = useMutation(sendProfileMemory)
  const form = useSchemaForm(setProfileMemory.input.body, { text: saved ?? '' })
  const editing = form.watch('text') !== (saved ?? '')
  async function submit(body: { text: string }) {
    try {
      await send.mutateAsync({ params: { companyId }, body })
    } catch (error) {
      setWriteError(form, error, UNSAVED)
    }
  }
  return (
    <Form form={form} onSubmit={submit}>
      {saved === null && <Empty>{EMPTY}</Empty>}
      <TextBox />
      <FormAlert />
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex flex-wrap gap-sm">
          <SubmitButton idle="Salvar" pending="Salvando…" />
          {editing && (
            <Button type="button" onClick={() => form.reset()}>
              Cancelar
            </Button>
          )}
        </div>
        {saved !== null && <EraseAll companyId={companyId} />}
      </div>
    </Form>
  )
}

/** "O que o Assistente lembra de você" in Sua conta: the person reads, corrects and erases their own. */
export function ProfileMemory() {
  const { companyId } = route.useParams()
  const read = useQuery(profileMemoryQuery(companyId))
  return (
    <SettingsSection id={ID} title={TITLE}>
      {read.isPending ? (
        <div role="status" aria-label="Carregando" className="flex flex-col gap-sm">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="w-24" />
        </div>
      ) : read.isError ? (
        <ReadFailure text={READ_FAILED} onRetry={() => void read.refetch()} />
      ) : (
        <Editor key={read.data.text ?? ''} companyId={companyId} saved={read.data.text} />
      )}
    </SettingsSection>
  )
}
