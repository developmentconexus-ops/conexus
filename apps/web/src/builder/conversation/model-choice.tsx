import type {
  CompanyId,
  Conversation,
  ModelAccount,
  ProjectId,
  ProviderOrder,
} from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { sentenceOf } from '../../platform/hub.ts'
import { Notice } from '../../ui/notice.tsx'
import { ModelPicker, providersQuery } from '../model-accounts/public.ts'
import { sendModel } from './queries.ts'

/** The providers the person has an account for: those of their order that hold an open account. */
export function usableProviders(accounts: {
  mine: readonly ModelAccount[]
  company: readonly ModelAccount[]
  order: readonly ProviderOrder[]
}): ReadonlySet<string> {
  const open = new Set(
    [...accounts.mine, ...accounts.company].flatMap((one) => (one.kindOff ? [] : [one.id])),
  )
  return new Set(
    accounts.order.flatMap((entry) =>
      entry.accounts.some((id) => open.has(id)) ? [entry.provider] : [],
    ),
  )
}

/** The step 11 notice for a person with no account to answer with, and the way to link one. */
export function NoAccount({ companyId }: { companyId: CompanyId }) {
  const row = FAILURES.MODEL_NO_ACCOUNT
  return (
    <div className="flex flex-col items-start gap-sm">
      <Notice>
        {row.phrase} {row.action}
      </Notice>
      <Link to="/companies/$companyId/model-account" params={{ companyId }} className="underline">
        Minha conta de modelo
      </Link>
    </div>
  )
}

/**
 * The model of the conversation, among the providers the person has an account for. A change
 * holds for the next answers, not the one in progress (design V54).
 */
export function ModelChoice(props: {
  companyId: CompanyId
  projectId: ProjectId
  conversation: Conversation
  usable: ReadonlySet<string>
}) {
  const { providers } = useSuspenseQuery(providersQuery).data
  const send = useMutation(sendModel)
  const [error, setError] = useState<string>()
  const [chosen, setChosen] = useState<string>()
  const shown = providers.filter((provider) => props.usable.has(provider.id))

  async function choose(model: string) {
    if (model === '' || model === props.conversation.model) return
    setError(undefined)
    setChosen(model)
    try {
      await send.mutateAsync({
        params: {
          companyId: props.companyId,
          projectId: props.projectId,
          conversationId: props.conversation.id,
        },
        body: { model },
      })
    } catch (failure) {
      setChosen(undefined)
      setError(sentenceOf(failure))
    }
  }

  return (
    <section aria-label="Modelo da conversa" className="flex max-w-column flex-col gap-md">
      <ModelPicker
        providers={shown}
        value={chosen ?? props.conversation.model}
        names={{ provider: 'Fornecedor do modelo', model: 'Modelo' }}
        onChange={(model) => void choose(model)}
      />
      <p className="text-label text-text-2">A troca vale para as próximas respostas.</p>
      {error !== undefined && <p role="alert">{error}</p>}
    </section>
  )
}
