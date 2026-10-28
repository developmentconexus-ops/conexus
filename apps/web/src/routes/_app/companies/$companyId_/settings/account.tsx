import { createFileRoute } from '@tanstack/react-router'
import { UserRoundIcon } from 'lucide-react'
import { MyAccount } from '../../../../../hub/identity/public.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/account')({
  staticData: {
    section: {
      group: 'you',
      label: 'Minha conta',
      icon: UserRoundIcon,
      summary: 'Seu nome, seu e-mail e a sua senha.',
      order: 10,
      keywords: ['nome', 'e-mail', 'senha'],
    },
  },
  component: MyAccount,
})
