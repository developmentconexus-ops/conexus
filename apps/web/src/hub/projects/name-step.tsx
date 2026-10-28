import type { CompanyDetail, Project } from '@conexus/hub-api'
import { appHostOf, createProject, hostLabelOf, PROJECT_NAME_MAX_LENGTH } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  setWriteError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { allProjectsQueryKey, sendProject } from './queries.ts'

const UNCONFIRMED = 'Não confirmamos a criação. Tente de novo.'
// The refusals the name is to blame for, shown on its field.
const ON_THE_NAME = {
  PROJECT_NAME_TAKEN: 'name',
  PROJECT_ADDRESS_TAKEN: 'name',
  PROJECT_NAME_NO_ADDRESS: 'name',
} as const
// The two refusals that leave no Project and say to try again, with the button that does.
const RETRYING = ['COMPANY_DATABASE_PREPARING', 'COMPANY_DATABASE_UNAVAILABLE']

/**
 * The name of the Projeto a request starts, typed after **Enviar** in the box's place, with the
 * app's address under it while it is typed. The first Project of a company waits for the company's
 * database, so the button says so while it does. The attempt key stays until the Hub settles the
 * outcome (web W24). Once the Projeto exists and `onCreated` failed, the name is `locked`: **Tentar
 * de novo** calls `onCreated` again with the same Projeto, and **Voltar** becomes **Abrir o
 * Projeto**, since the name never changes (decision 0024).
 */
export function NameStep(props: {
  company: CompanyDetail
  databaseReady: boolean
  locked: string | null
  onCreated: (project: Project) => Promise<void>
  onBack: () => void
  onOpenProject: () => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const send = useMutation(sendProject)
  const attempt = useAttemptKey()
  const made = useRef<Project | null>(null)
  const form = useSchemaForm(createProject.input.body, { name: '' })
  const { company, locked } = props
  const label =
    company.nickname === null
      ? undefined
      : hostLabelOf({ name: form.watch('name'), nickname: company.nickname })

  useEffect(() => form.setFocus('name'), [form])

  async function submit(values: { name: string }) {
    try {
      made.current ??= (
        await attempt((attemptKey) =>
          send.mutateAsync({ params: { companyId: company.id }, body: values, attemptKey }),
        )
      ).project
      await props.onCreated(made.current)
    } catch (error) {
      if (!(error instanceof HubFailure)) setServerError(form, error)
      else if (error.code === 'NOT_FOUND') {
        // The company is gone for this person: the page reads again and shows what the Hub says.
        queryClient.removeQueries({ queryKey: allProjectsQueryKey(company.id) })
        await router.invalidate()
      } else if (RETRYING.includes(error.code)) {
        form.setError('root.server', { type: 'retry', message: sentenceOf(error) })
      } else setWriteError(form, error, UNCONFIRMED, ON_THE_NAME)
    }
  }

  return (
    <Form form={form} onSubmit={submit}>
      <div className="flex w-full flex-col gap-sm">
        {locked === null ? (
          <TextField
            name="name"
            label="Nome do projeto"
            type="text"
            autoComplete="off"
            invalid={`Escreva o nome do Projeto, com até ${PROJECT_NAME_MAX_LENGTH} caracteres.`}
          />
        ) : (
          <p className="flex flex-col gap-xs">
            <span className="text-label text-text-2">Nome do projeto</span>
            <span className="text-text">{locked}</span>
          </p>
        )}
        {label && (
          <p className="flex flex-wrap gap-x-xs text-label text-text-2">
            Endereço do app:
            <span className="break-all font-mono text-fact text-text">
              {appHostOf({ label, appsDomain: company.appsDomain })}
            </span>
          </p>
        )}
      </div>
      <FormAlert />
      <div className="flex flex-wrap gap-sm max-md:flex-col">
        {form.formState.errors.root?.server?.type === 'retry' && (
          <Button type="button" onClick={() => void form.handleSubmit(submit)()}>
            Tentar de novo
          </Button>
        )}
        <SubmitButton
          idle={locked === null ? 'Criar e começar' : 'Tentar de novo'}
          pending={props.databaseReady ? 'Criando…' : 'Preparando o banco da empresa…'}
        />
        {locked === null ? (
          <Button type="button" onClick={props.onBack}>
            Voltar
          </Button>
        ) : (
          <Button type="button" onClick={props.onOpenProject}>
            Abrir o Projeto
          </Button>
        )}
      </div>
    </Form>
  )
}
