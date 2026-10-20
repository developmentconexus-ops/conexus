import { createFileRoute } from '@tanstack/react-router'
import { PageTitle } from '../../../../../ui/list.tsx'
import { ThemeChoice } from '../../../../../ui/theme-choice.tsx'

function Appearance() {
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle>Aparência</PageTitle>
      <ThemeChoice />
    </div>
  )
}

export const Route = createFileRoute('/_app/companies/$companyId_/settings/appearance')({
  staticData: {
    place: 'Aparência',
    section: { group: 'you', label: 'Aparência', order: 30, keywords: ['tema', 'claro', 'escuro'] },
  },
  component: Appearance,
})
