import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignOutButton, WelcomeCompany } from '../../../../../hub/identity/public.ts'
import { WelcomeFrame } from '../../../../../ui/welcome-frame.tsx'

function Step() {
  return (
    <WelcomeFrame step={1} title="Sua empresa" exit={<SignOutButton label="Sair" />}>
      <WelcomeCompany />
    </WelcomeFrame>
  )
}

// Once saved, the nickname does not change: step 1 does not open again.
export const Route = createFileRoute('/_app/companies/$companyId_/welcome/company')({
  staticData: { place: 'Sua empresa' },
  beforeLoad: ({ context, params }) => {
    if (context.company.nickname !== null) {
      throw redirect({ to: '/companies/$companyId/welcome/model-account', params, replace: true })
    }
  },
  component: Step,
})
