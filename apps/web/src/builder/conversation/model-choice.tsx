import type { CompanyId, Conversation, Effort, ProjectId, ProviderId } from '@conexus/hub-api'
import { providerOfModel } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { sentenceOfCode, writeFailureText } from '../../platform/hub.ts'
import { Notice } from '../../ui/notice.tsx'
import { ModelPicker, providersQuery } from '../model-accounts/public.ts'
import { sendModel } from './queries.ts'
import { UNCONFIRMED_MODEL } from './text.ts'

/** The step 11 notice for a person with no account to answer with, and the way to link one. */
export function NoAccount({ companyId }: { companyId: CompanyId }) {
  return (
    <div className="flex flex-col items-start gap-sm">
      <Notice>{sentenceOfCode('MODEL_NO_ACCOUNT')}</Notice>
      <Link to="/companies/$companyId/model-account" params={{ companyId }} className="underline">
        Minha conta de modelo
      </Link>
    </div>
  )
}

/**
 * The model and the reasoning of the conversation, among the providers the person has an account
 * for, in one button of the composer. A change holds for the next answers, not the one in progress
 * (design V54); a refusal is said below the button.
 */
export function ModelChoice(props: {
  ids: { companyId: CompanyId; projectId: ProjectId }
  conversation: Conversation
  usable: ReadonlySet<ProviderId>
  onError: (text: string | undefined) => void
}) {
  const { providers } = useSuspenseQuery(providersQuery).data
  const send = useMutation(sendModel)
  const [chosen, setChosen] = useState<{ model: string; effort: Effort }>()
  const shown = useMemo(
    () => providers.filter((provider) => props.usable.has(provider.id)),
    [providers, props.usable],
  )
  const now = chosen ?? props.conversation

  async function choose(model: string, effort: Effort) {
    props.onError(undefined)
    setChosen({ model, effort })
    try {
      await send.mutateAsync({
        params: { ...props.ids, conversationId: props.conversation.id },
        body: { model, effort },
      })
    } catch (failure) {
      setChosen(undefined)
      props.onError(writeFailureText(failure, UNCONFIRMED_MODEL))
    }
  }

  function pickModel(model: string) {
    if (model === now.model) return
    const provider = providers.find((one) => one.id === providerOfModel(model))
    const efforts = provider?.models.find((one) => `${provider.id}/${one.id}` === model)?.efforts
    void choose(model, efforts?.includes(now.effort) ? now.effort : 'off')
  }

  return (
    <ModelPicker
      providers={shown}
      value={now.model}
      name="Modelo e raciocínio"
      onChange={pickModel}
      effort={{ value: now.effort, onChange: (effort) => void choose(now.model, effort) }}
    />
  )
}
