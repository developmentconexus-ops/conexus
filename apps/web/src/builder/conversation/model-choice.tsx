import type {
  CompanyId,
  Conversation,
  ConversationId,
  Effort,
  ModelId,
  ProjectId,
  Provider,
} from '@conexus/hub-api'
import { runningEffort } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { sentenceOfCode, writeFailureText } from '../../platform/hub.ts'
import { Notice } from '../../ui/notice.tsx'
import { ModelPicker } from '../model-accounts/public.ts'
import { conversationQuery, sendModel } from './queries.ts'
import { UNCONFIRMED_MODEL } from './text.ts'

/** The step 11 notice for a person with no account to answer with, and the way to link one. */
export function NoAccount({ companyId }: { companyId: CompanyId }) {
  return (
    <div className="flex flex-col items-start gap-sm">
      <Notice>{sentenceOfCode('MODEL_NO_ACCOUNT')}</Notice>
      <Link
        to="/companies/$companyId/settings/my-model-accounts"
        params={{ companyId }}
        className="underline"
      >
        Minhas contas de modelo
      </Link>
    </div>
  )
}

type Choice = Pick<Conversation, 'model' | 'effort'>
/** What the screen asks: typed with the brand the wire's input parse leaves out. */
type Asked = {
  params: { companyId: CompanyId; projectId: ProjectId; conversationId: ConversationId }
  body: Choice
}

/**
 * The model and the reasoning of the conversation, among the providers the person has an account
 * for, in one button of the composer. A change holds for the next answers, not the one in progress
 * (design V54); a refusal is said below the button.
 */
export function ModelChoice(props: {
  ids: { companyId: CompanyId; projectId: ProjectId }
  conversation: Conversation
  /** What the Hub offers this person: their connected providers, with the models served. */
  providers: readonly Provider[]
  onError: (text: string | undefined) => void
}) {
  const queryClient = useQueryClient()
  const send = useMutation<Choice, Error, Asked>({
    ...sendModel,
    onSuccess: (kept) =>
      queryClient.setQueryData<{ conversation: Conversation }>(
        conversationQuery(props.ids.companyId, props.ids.projectId, props.conversation.id).queryKey,
        (read) => read && { conversation: { ...read.conversation, ...kept } },
      ),
  })
  const now = send.isPending ? send.variables.body : props.conversation

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
    const efforts = props.providers
      .flatMap((provider) => provider.models)
      .find((one) => one.id === model)?.efforts
    // A level the new model lacks runs as the closest one it offers, as the Hub asks the provider.
    choose(model, efforts === undefined ? 'off' : runningEffort(efforts, now.effort))
  }

  return (
    <ModelPicker
      providers={props.providers}
      value={now.model}
      name="Modelo e raciocínio"
      heading="Modelo desta conversa"
      className="h-8 rounded-pill px-sm text-label font-medium hover:bg-accent-soft data-popup-open:bg-accent-soft"
      onChange={pickModel}
      effort={{ value: now.effort, onChange: (effort) => choose(now.model, effort) }}
    />
  )
}
