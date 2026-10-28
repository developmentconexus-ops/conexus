import { createFileRoute, useRouter } from '@tanstack/react-router'
import { KeyRoundIcon } from 'lucide-react'
import {
  accountsQuery,
  ModelAccounts,
  providersQuery,
} from '../../../../../builder/model-accounts/public.ts'
import { everyMemberQuery } from '../../../../../hub/identity/public.ts'
import { readOrNotFound, sentenceOf } from '../../../../../platform/hub.ts'
import { ReadFailure } from '../../../../../ui/states.tsx'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/model-accounts')({
  staticData: {
    section: {
      group: 'you',
      label: 'Contas de modelo',
      icon: KeyRoundIcon,
      summary: 'As contas que o Builder usa, na ordem em que tenta cada uma.',
      order: 20,
      keywords: ['modelo', 'chave', 'assinatura', 'claude', 'google', 'troca automática'],
    },
  },
  loader: async ({ context, params }) => {
    const { queryClient } = context
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(accountsQuery(params.companyId)),
        queryClient.ensureQueryData(providersQuery),
        queryClient.ensureQueryData(everyMemberQuery(params.companyId)),
      ]),
    )
  },
  errorComponent: AccountsFailure,
  component: ModelAccounts,
})

/** The accounts could not be read: the sentence and a way to read again, inside the settings frame. */
function AccountsFailure({ error, reset }: { error: unknown; reset: () => void }) {
  const router = useRouter()
  return (
    <ReadFailure text={sentenceOf(error)} onRetry={() => void router.invalidate().then(reset)} />
  )
}
