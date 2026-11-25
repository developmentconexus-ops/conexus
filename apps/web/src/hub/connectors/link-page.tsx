import type { ConnectionLinkPage } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { HubFailure } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Form, FormAlert, setServerError, useSchemaForm } from '../../ui/form.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { Spinner } from '../../ui/spinner.tsx'
import {
  LINK_GONE,
  LINK_GONE_NEXT,
  linkAskedText,
  linkDoneText,
  linkDoneTitle,
  linkOnceText,
  linkPageTitle,
  SEND_KEYS,
  TESTING_LINE,
} from './lake-text.ts'
import { fieldsShape, KeyFields } from './link-fields.tsx'
import { sendLinkAnswer } from './queries.ts'
import type { Refusal } from './said.tsx'
import { Refused } from './said.tsx'

const route = getRouteApi('/_public/connection-links/$secret')

type Stage = { step: 'ASK'; refusal: Refusal | null } | { step: 'DONE' } | { step: 'GONE' }

/** The page of a link that no longer opens: spent, past its 30 minutes, or a secret that is not one. */
export function LinkGone() {
  return (
    <div className="flex flex-col gap-md">
      <PageTitle>{LINK_GONE}</PageTitle>
      <p className="text-text-2">{LINK_GONE_NEXT}</p>
    </div>
  )
}

function Done({ page }: { page: ConnectionLinkPage }) {
  return (
    <div role="status" className="flex flex-col gap-md">
      <PageTitle>{linkDoneTitle(page.system.name)}</PageTitle>
      <p className="text-text-2">{linkDoneText(page.askedBy)}</p>
    </div>
  )
}

function Testing() {
  return (
    <p role="status" className="flex items-center gap-sm">
      <Spinner label={TESTING_LINE} />
      <span>{TESTING_LINE}</span>
    </p>
  )
}

function AskForm(props: {
  secret: string
  page: ConnectionLinkPage
  refusal: Refusal | null
  onStage: (stage: Stage) => void
}) {
  const { page } = props
  const send = useMutation(sendLinkAnswer)
  const form = useSchemaForm(
    z.object(fieldsShape(page.fields)),
    Object.fromEntries(page.fields.map((field) => [field.name, ''])),
  )

  async function submit(fields: Record<string, string>) {
    props.onStage({ step: 'ASK', refusal: null })
    try {
      const answer = await send.mutateAsync({ params: { secret: props.secret }, body: { fields } })
      props.onStage(
        answer.result === 'WORKING' ? { step: 'DONE' } : { step: 'ASK', refusal: answer },
      )
    } catch (failure) {
      if (failure instanceof HubFailure && failure.code === 'NOT_FOUND') {
        props.onStage({ step: 'GONE' })
        return
      }
      setServerError(form, failure)
    }
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm">
        <PageTitle>{linkPageTitle(page.system.name)}</PageTitle>
        <p className="text-text-2">{linkAskedText(page.askedBy, page.system.name, page.company)}</p>
        <p className="text-text-2">{linkOnceText(page.askedBy)}</p>
      </div>
      {props.refusal !== null && <Refused answer={props.refusal} name={page.system.name} />}
      <Form form={form} onSubmit={submit}>
        <KeyFields fields={page.fields} />
        <FormAlert />
        {form.formState.isSubmitting ? (
          <Testing />
        ) : (
          <div>
            <Button type="submit" variant="primary">
              {SEND_KEYS}
            </Button>
          </div>
        )}
      </Form>
    </div>
  )
}

/** The page a link opens with no session: who asked, the system, and only the fields asked, empty. */
export function LinkPage() {
  const { secret } = route.useParams()
  const page = route.useLoaderData()
  const [stage, setStage] = useState<Stage>({ step: 'ASK', refusal: null })
  if (stage.step === 'GONE') return <LinkGone />
  if (stage.step === 'DONE') return <Done page={page} />
  return <AskForm secret={secret} page={page} refusal={stage.refusal} onStage={setStage} />
}
