import { COMPANY_NAME_MAX_LENGTH, createCompany } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { makeCompany } from './queries.ts'

export function CreateCompanyForm() {
  const router = useRouter()
  const send = useMutation({
    ...makeCompany,
    onSuccess: ({ company }) =>
      router.navigate({ to: '/companies/$companyId', params: { companyId: company.id } }),
  })
  const attempt = useAttemptKey()
  const form = useSchemaForm(createCompany.input.body, { name: '' })

  async function submit({ name }: { name: string }) {
    try {
      await attempt((attemptKey) => send.mutateAsync({ body: { name }, attemptKey }))
    } catch (error) {
      setServerError(form, error)
    }
  }

  return (
    <section className="flex w-full max-w-column flex-col gap-lg">
      <PageTitle>Nova empresa</PageTitle>
      <Form form={form} onSubmit={submit}>
        <TextField
          name="name"
          label="Nome"
          type="text"
          autoComplete="organization"
          invalid={`Escreva o nome da empresa, com até ${COMPANY_NAME_MAX_LENGTH} caracteres.`}
        />
        <FormAlert />
        <SubmitButton idle="Criar empresa" pending="Criando…" />
      </Form>
    </section>
  )
}
