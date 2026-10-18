import { createFileRoute } from '@tanstack/react-router'
import { CompanySetup } from '../../../../hub/identity/public.ts'

export const Route = createFileRoute('/_app/companies/$companyId/setup')({
  staticData: { place: 'Configurar a empresa' },
  component: CompanySetup,
})
