import { createFileRoute } from '@tanstack/react-router'
import { Building2Icon } from 'lucide-react'
import { CompanyGeneral } from '../../../../../hub/identity/public.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/general')({
  staticData: {
    section: {
      group: 'company',
      label: 'Geral',
      icon: Building2Icon,
      summary: 'O nome, o apelido e o endereço da empresa.',
      order: 10,
      keywords: ['nome', 'apelido', 'endereço'],
    },
  },
  component: CompanyGeneral,
})
