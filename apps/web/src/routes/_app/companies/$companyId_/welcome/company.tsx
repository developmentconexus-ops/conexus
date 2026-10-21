import { createFileRoute } from '@tanstack/react-router'
import { WelcomeCompany } from '../../../../../hub/identity/public.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/welcome/company')({
  staticData: { place: 'Sua empresa', step: 1 },
  component: WelcomeCompany,
})
