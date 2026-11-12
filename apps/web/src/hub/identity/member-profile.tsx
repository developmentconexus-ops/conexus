import type { CompanyId, Member } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { FormProvider } from 'react-hook-form'
import { unconfirmedText } from '../../platform/hub.ts'
import { FieldGroup } from '../../ui/field.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setWriteError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { SettingsSection } from '../../ui/settings-section.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { ActionDialog, isGone } from './member-actions.tsx'
import { fieldsOf, ProfileFields, TOO_LONG } from './member-fields.ts'
import { everyMemberQuery, sessionQuery, writeMemberProfile } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/account')

const ID = 'job-profile'
const READ_FAILED = 'Não foi possível ler o seu cargo e a sua área.'
const UNSAVED = unconfirmedText(
  'se o cargo e a área foram salvos',
  'Confira os campos e tente de novo.',
)

/** The two fields of a member, drawn by the form that holds them. */
function Inputs() {
  return (
    <div className="grid gap-lg sm:grid-cols-2">
      <TextField
        name="jobTitle"
        label="Cargo"
        type="text"
        autoComplete="organization-title"
        invalid={TOO_LONG}
      />
      <TextField name="department" label="Área" type="text" autoComplete="off" invalid={TOO_LONG} />
    </div>
  )
}

/** The person's own fields and their button; a new text from the Hub mounts a new form, so it shows what stayed. */
function Editor({ companyId, mine }: { companyId: CompanyId; mine: Member }) {
  const send = useMutation(writeMemberProfile)
  const form = useSchemaForm(ProfileFields, fieldsOf(mine))
  async function submit(body: { jobTitle: string | null; department: string | null }) {
    try {
      await send.mutateAsync({ params: { companyId, personId: mine.personId }, body })
    } catch (error) {
      setWriteError(form, error, UNSAVED)
    }
  }
  return (
    <Form form={form} onSubmit={submit}>
      <Inputs />
      <FormAlert />
      <div>
        <SubmitButton idle="Salvar" pending="Salvando…" />
      </div>
    </Form>
  )
}

/** "Cargo e área" in Sua conta: the person writes their own job title and department for the Assistant. */
export function MyProfile() {
  const { companyId } = route.useParams()
  const session = useQuery(sessionQuery)
  const read = useQuery(everyMemberQuery(companyId))
  const me = session.data?.state === 'SIGNED_IN' ? session.data.person.id : undefined
  const mine = read.data?.find((one) => one.personId === me)
  return (
    <SettingsSection
      id={ID}
      title="Cargo e área"
      description="Ajuda o Assistente a entender o seu trabalho."
    >
      {read.isError ? (
        <ReadFailure text={READ_FAILED} onRetry={() => void read.refetch()} />
      ) : mine === undefined ? (
        <div role="status" aria-label="Carregando" className="flex flex-col gap-sm">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="w-24" />
        </div>
      ) : (
        <Editor key={`${mine.jobTitle}|${mine.department}`} companyId={companyId} mine={mine} />
      )}
    </SettingsSection>
  )
}

/** Another member's job title and department, in a dialog: the person who may change roles writes them. */
export function EditProfile({ companyId, member }: { companyId: CompanyId; member: Member }) {
  const [open, setOpen] = useState(false)
  const send = useMutation(writeMemberProfile)
  const form = useSchemaForm(ProfileFields, fieldsOf(member))
  function changeOpen(next: boolean) {
    form.reset(fieldsOf(member))
    setOpen(next)
  }
  const confirm = form.handleSubmit((body) =>
    send.mutate(
      { params: { companyId, personId: member.personId }, body },
      { onSuccess: () => setOpen(false), onError: (error) => isGone(error) && setOpen(false) },
    ),
  )
  return (
    <ActionDialog
      open={open}
      onOpenChange={changeOpen}
      trigger={{ label: 'Cargo e área', name: `Cargo e área: ${member.name}`, danger: false }}
      title={`Cargo e área de ${member.name}`}
      description="O Assistente usa estes textos para entender o trabalho da pessoa."
      confirm={{ label: 'Salvar', pending: 'Salvando…' }}
      write={send}
      onConfirm={() => void confirm()}
    >
      <FormProvider {...form}>
        <FieldGroup>
          <Inputs />
        </FieldGroup>
      </FormProvider>
    </ActionDialog>
  )
}
