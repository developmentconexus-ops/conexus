import { createFileRoute } from '@tanstack/react-router'
import { CompanyGeneral } from '../../../../../hub/identity/public.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/general')({
  staticData: {
    place: 'Geral',
    section: {
      group: 'company',
      label: 'Geral',
      order: 10,
      keywords: ['nome', 'apelido', 'endereço'],
    },
  },
  component: CompanyGeneral,
})
