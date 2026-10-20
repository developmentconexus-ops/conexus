import { createFileRoute } from '@tanstack/react-router'
import { MyAccount } from '../../../../../hub/identity/public.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/account')({
  staticData: {
    place: 'Minha conta',
    section: {
      group: 'you',
      label: 'Minha conta',
      order: 10,
      keywords: ['nome', 'e-mail', 'senha'],
    },
  },
  component: MyAccount,
})
