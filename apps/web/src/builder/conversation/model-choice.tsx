import type { CompanyId, ConversationId, Effort, ModelId, Provider } from '@conexus/hub-api'
import { runningEffort } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { sentenceOfCode, writeFailureText } from '../../platform/hub.ts'
import { buttonVariants, touchArea } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Notice } from '../../ui/notice.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { ModelPicker, modelLabel } from '../model-accounts/public.ts'
import type { SessionRead } from './queries.ts'
import { sessionReadQuery } from './queries.ts'
import type { Controller } from './session.ts'
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
        to="/companies/$companyId/settings/model-accounts"
        params={{ companyId: props.companyId }}
        className={
          props.action === 'button'
            ? // Wraps at 200% zoom on a phone instead of pushing the page sideways (design V18).
              cn(buttonVariants(), 'h-auto min-h-8 whitespace-normal py-xs')
            : 'underline'
        }
      >
        Minhas contas de modelo
      </Link>
    </div>
  )
}

export type Choice = Pick<SessionRead, 'model' | 'effort'>

/**
 * The model and the reasoning of the conversation, among the providers the person has an account
 * for, in one button of the composer. The caller owns the write (the Builder's or the Assistant's
 * route) and the session it changes; a change holds for the next answers, not the one in progress
 * (design V54); a refusal is said below the button.
 */
export function ModelChoice(props: {
  controller: Controller
  conversationId: ConversationId
  session: SessionRead
  /** What the Hub offers this person: their connected providers, with the models served. */
  providers: readonly Provider[]
  /** The caller's write, with the key the Hub's operation gives it: the choice goes to its route and what the Hub kept comes back. */
  write: { mutationKey: readonly string[]; mutationFn: (choice: Choice) => Promise<Choice> }
  onError: (text: string | undefined) => void
}) {
  const queryClient = useQueryClient()
  const send = useMutation<Choice, Error, Choice>({
    ...props.write,
    onSuccess: (kept) =>
      queryClient.setQueryData<SessionRead>(
        sessionReadQuery(props.conversationId, props.controller).queryKey,
        (read) => read && { ...read, ...kept },
      ),
  })
  const now = send.isPending ? send.variables : props.session

  function choose(model: ModelId, effort: Effort) {
    props.onError(undefined)
    send.mutate(
      { model, effort },
      { onError: (failure) => props.onError(writeFailureText(failure, UNCONFIRMED_MODEL)) },
    )
  }

  return (
    <span aria-busy={send.isPending} className="inline-flex min-w-0 shrink aria-busy:opacity-60">
      <ComposerModelPicker
        providers={props.providers}
        value={now}
        heading="Modelo desta conversa"
        onChange={(choice) => choose(choice.model, choice.effort)}
      />
    </span>
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
      className={cn(
        touchArea,
        'h-8 rounded-pill bg-surface-3 px-sm text-label font-medium hover:bg-accent-soft data-popup-open:bg-accent-soft',
      )}
      onChange={pickModel}
      effort={{ value: effort, onChange: (next) => props.onChange({ model: now, effort: next }) }}
    />
  )
}

/** The model that answers, named and not changed: where the conversation's route does not take a choice (the Construtor's). */
export function ComposerModelName({ model }: { model: ModelId }) {
  return (
    <span className="inline-flex h-8 min-w-0 items-center rounded-pill bg-surface-3 px-sm text-label font-medium">
      <span className="truncate">{modelLabel(model)}</span>
    </span>
  )
}
