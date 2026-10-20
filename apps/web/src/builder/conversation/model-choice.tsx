import type { CompanyId, Conversation, Effort, ProjectId, ProviderId } from '@conexus/hub-api'
import { ModelId, providerOfModel } from '@conexus/hub-api'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { sentenceOfCode, writeFailureText } from '../../platform/hub.ts'
import { Notice } from '../../ui/notice.tsx'
import { ModelPicker, providersQuery } from '../model-accounts/public.ts'
import { conversationQuery, sendModel } from './queries.ts'
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
  const queryClient = useQueryClient()
  const send = useMutation({
    ...sendModel,
    onSuccess: (kept) =>
      queryClient.setQueryData<{ conversation: Conversation }>(
        conversationQuery(props.ids.companyId, props.ids.projectId, props.conversation.id).queryKey,
        (read) => read && { conversation: { ...read.conversation, ...kept } },
      ),
  })
  const shown = useMemo(
    () => providers.filter((provider) => props.usable.has(provider.id)),
    [providers, props.usable],
  )
  const asked = send.isPending ? ModelId.safeParse(send.variables.body.model) : undefined
  const now =
    send.isPending && asked?.success
      ? { model: asked.data, effort: send.variables.body.effort }
      : props.conversation

  function choose(model: ModelId, effort: Effort) {
    props.onError(undefined)
    send.mutate(
      {
        params: { ...props.ids, conversationId: props.conversation.id },
        body: { model, effort },
      },
      { onError: (failure) => props.onError(writeFailureText(failure, UNCONFIRMED_MODEL)) },
    )
  }

  function pickModel(model: ModelId) {
    if (model === now.model) return
    const provider = providers.find((one) => one.id === providerOfModel(model))
    const efforts = provider?.models.find((one) => `${provider.id}/${one.id}` === model)?.efforts
    choose(model, efforts?.includes(now.effort) ? now.effort : 'off')
  }

  return (
    <ModelPicker
      providers={shown}
      value={now.model}
      name="Modelo e raciocínio"
      onChange={pickModel}
      effort={{ value: now.effort, onChange: (effort) => choose(now.model, effort) }}
    />
  )
}
