import { createFileRoute } from '@tanstack/react-router'
import { UserRoundIcon } from 'lucide-react'
import { ProfileMemory } from '../../../../../builder/assistant/public.ts'
import { MyAccount, MyProfile } from '../../../../../hub/identity/public.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/account')({
  staticData: {
    section: {
      group: 'you',
      label: 'Minha conta',
      icon: UserRoundIcon,
      summary: 'Seu nome, seu e-mail, seu cargo e sua área.',
      order: 10,
      keywords: ['nome', 'e-mail', 'cargo', 'área', 'memória', 'Assistente'],
    },
  },
  component: Account,
})

function Account() {
  return (
    <div className="flex flex-col gap-2xl">
      <MyAccount />
      <MyProfile />
      <ProfileMemory />
    </div>
  )
}
