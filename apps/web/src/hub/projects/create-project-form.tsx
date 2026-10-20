import type { CompanyDetail } from '@conexus/hub-api'
import { appHostOf, createProject, hostLabelOf, PROJECT_NAME_MAX_LENGTH } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { keepsAttemptKey, useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { allProjectsQueryKey, sendProject } from './queries.ts'

const UNCONFIRMED = 'Não confirmamos a criação. Tente de novo.'
// The two refusals that leave no Project and say to try again, with the button that does.
// The refusals the name is to blame for, shown on its field.
const ON_THE_NAME = ['PROJECT_NAME_TAKEN', 'PROJECT_ADDRESS_TAKEN', 'PROJECT_NAME_NO_ADDRESS']
const RETRYING = ['COMPANY_DATABASE_PREPARING', 'COMPANY_DATABASE_UNAVAILABLE']

/**
 * "Criar projeto": the first Project of a company waits for the company's database, so the button
 * says so while it does. The attempt key stays until the Hub settles the outcome (web W24); the
 * Projeto created opens.
 */
export function CreateProjectForm(props: { company: CompanyDetail; databaseReady: boolean }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const send = useMutation(sendProject)
  const attempt = useAttemptKey()
  const form = useSchemaForm(createProject.input.body, { name: '' })
  const { company } = props
  const label =
    company.nickname === null
      ? undefined
      : hostLabelOf({ name: form.watch('name'), nickname: company.nickname })

  async function submit(values: { name: string }) {
    try {
      const { project } = await attempt((attemptKey) =>
        send.mutateAsync({ params: { companyId: company.id }, body: values, attemptKey }),
      )
      await router.navigate({
        to: '/companies/$companyId/projects/$projectId',
        params: { companyId: company.id, projectId: project.id },
      })
    } catch (error) {
      if (!(error instanceof HubFailure)) setServerError(form, error)
      else if (error.code === 'NOT_FOUND') {
        // The company is gone for this person: the page reads again and shows what the Hub says.
        queryClient.removeQueries({ queryKey: allProjectsQueryKey(company.id) })
        await router.invalidate()
      } else if (ON_THE_NAME.includes(error.code)) setServerError(form, error, 'name')
      else if (RETRYING.includes(error.code)) {
        form.setError('root.server', { type: 'retry', message: sentenceOf(error) })
      } else if (keepsAttemptKey(error)) {
        form.setError('root.server', { type: 'server', message: UNCONFIRMED })
      } else setServerError(form, error)
    }
  }

  return (
    <section className="flex w-full max-w-column flex-col gap-lg">
      <Form form={form} onSubmit={submit}>
        <TextField
          name="name"
          label="Nome do projeto"
          type="text"
          autoComplete="off"
          invalid={`Escreva o nome do Projeto, com até ${PROJECT_NAME_MAX_LENGTH} caracteres.`}
        />
        {label && (
          <p className="text-label text-text-2">
            Endereço do app:{' '}
            <span className="font-mono text-fact">
              {appHostOf({ label, appsDomain: company.appsDomain })}
            </span>
          </p>
        )}
        <FormAlert />
        {form.formState.errors.root?.server?.type === 'retry' && (
          <Button type="button" onClick={() => void form.handleSubmit(submit)()}>
            Tentar de novo
          </Button>
        )}
        <SubmitButton
          idle="Criar projeto"
          pending={props.databaseReady ? 'Criando…' : 'Preparando o banco da empresa…'}
        />
      </Form>
    </section>
  )
}
