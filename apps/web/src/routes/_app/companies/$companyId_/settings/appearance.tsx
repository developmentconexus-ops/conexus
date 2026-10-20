import { createFileRoute } from '@tanstack/react-router'
import { ThemeChoice } from '../../../../../ui/theme-choice.tsx'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/appearance')({
  staticData: {
    section: { group: 'you', label: 'Aparência', order: 30, keywords: ['tema', 'claro', 'escuro'] },
  },
  component: ThemeChoice,
})
