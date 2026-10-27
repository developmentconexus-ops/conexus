import type {
  CompanyId,
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
import { buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Notice } from '../../ui/notice.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { ModelPicker } from '../model-accounts/public.ts'
import type { SessionRead } from './queries.ts'
import { sendModel, sessionReadQuery } from './queries.ts'
import { NO_SECRETS, UNCONFIRMED_MODEL } from './text.ts'

/**
 * The step 11 notice for a person with no account to answer with, and the way to link one: a link
 * in the conversation, a button on Início, where there is no model to change instead.
 */
export function NoAccount(props: {
  companyId: CompanyId
  text?: string
  action?: 'link' | 'button'
}) {
  return (
    <div className="flex flex-col items-start gap-sm">
      <Notice>{props.text ?? sentenceOfCode('MODEL_NO_ACCOUNT')}</Notice>
      <Link
        to="/companies/$companyId/settings/my-model-accounts"
        params={{ companyId: props.companyId }}
        className={
          props.action === 'button'
            ? // Wraps at 200% zoom on a phone instead of pushing the page sideways (design V18).
              cn(
                buttonVariants(),
                'h-auto min-h-[34px] whitespace-normal py-xs max-md:h-auto max-md:min-h-11',
              )
            : 'underline'
        }
      >
        Minhas contas de modelo
      </Link>
    </div>
  )
}

type Choice = Pick<SessionRead, 'model' | 'effort'>
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
  conversationId: ConversationId
  session: SessionRead
  /** What the Hub offers this person: their connected providers, with the models served. */
  providers: readonly Provider[]
  onError: (text: string | undefined) => void
}) {
  const queryClient = useQueryClient()
  const send = useMutation<Choice, Error, Asked>({
    ...sendModel,
    onSuccess: (kept) =>
      queryClient.setQueryData<SessionRead>(
        sessionReadQuery(props.conversationId).queryKey,
        (read) => read && { ...read, ...kept },
      ),
  })
  const now = send.isPending ? send.variables.body : props.session

  function choose(model: ModelId, effort: Effort) {
    props.onError(undefined)
    send.mutate(
      {
        params: { ...props.ids, conversationId: props.conversationId },
        body: { model, effort },
      },
      { onError: (failure) => props.onError(writeFailureText(failure, UNCONFIRMED_MODEL)) },
    )
  }

  return (
    <ComposerModelPicker
      providers={props.providers}
      value={now}
      heading="Modelo desta conversa"
      onChange={(choice) => choose(choice.model, choice.effort)}
    />
  )
}

/**
 * The composer's button for the model and its reasoning, in the conversation and on Início. A level
 * the new model lacks runs as the closest one it offers, as the Hub asks the provider.
 */
export function ComposerModelPicker(props: {
  providers: readonly Provider[]
  value: Choice
  heading: string
  onChange: (choice: Choice) => void
}) {
  const phone = useIsMobile()
  const { model: now, effort } = props.value

  function pickModel(model: ModelId) {
    if (model === now) return
    const efforts = props.providers
      .flatMap((provider) => provider.models)
      .find((one) => one.id === model)?.efforts
    props.onChange({
      model,
      effort: efforts === undefined ? 'off' : runningEffort(efforts, effort),
    })
  }

  return (
    <ModelPicker
      providers={props.providers}
      value={now}
      name="Modelo e raciocínio"
      heading={props.heading}
      note={phone ? NO_SECRETS : undefined}
      chevron={false}
      className="h-8 rounded-pill bg-surface-3 px-sm max-md:h-11 text-label font-medium hover:bg-accent-soft data-popup-open:bg-accent-soft"
      onChange={pickModel}
      effort={{ value: effort, onChange: (next) => props.onChange({ model: now, effort: next }) }}
    />
  )
}
