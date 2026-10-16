import { createFileRoute } from '@tanstack/react-router'
import { CreateCompanyForm } from '../../../hub/identity/public.ts'

export const Route = createFileRoute('/_app/companies/new')({
  staticData: { place: 'Nova empresa' },
  component: CreateCompanyForm,
})
