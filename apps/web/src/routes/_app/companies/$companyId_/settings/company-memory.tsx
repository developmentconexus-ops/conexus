import { createFileRoute } from '@tanstack/react-router'
import { LibraryIcon } from 'lucide-react'
import { CompanyMemory } from '../../../../../agents/assistant/public.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/company-memory')({
  staticData: {
    section: {
      group: 'company',
      label: 'Memória da empresa',
      icon: LibraryIcon,
      summary: 'As instruções e as páginas que o Conexus segue em toda conversa da empresa.',
      order: 45,
      keywords: ['instruções', 'memória', 'Conexus', 'páginas'],
    },
  },
  component: CompanyMemory,
})
