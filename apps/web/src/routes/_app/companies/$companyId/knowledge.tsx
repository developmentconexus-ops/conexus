import { createFileRoute } from '@tanstack/react-router'
import { CompanyMemory } from '../../../../agents/assistant/public.ts'

// Conhecimento (web W30): the company's instructions and pages, which every role reads.
export const Route = createFileRoute('/_app/companies/$companyId/knowledge')({
  staticData: { place: 'Conhecimento' },
  component: CompanyMemory,
})
