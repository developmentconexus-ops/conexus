import { createFileRoute, Outlet } from '@tanstack/react-router'
import { companyParams, enterCompany, rememberCompany } from '../../../../../hub/identity/public.ts'

// The owner's first entry (web W33), outside the company's frame: anyone else goes to Início.
export const Route = createFileRoute('/_app/companies/$companyId_/welcome')({
  params: companyParams,
  beforeLoad: ({ context, params }) =>
    enterCompany({ context, companyId: params.companyId, frame: 'welcome' }),
  onEnter: ({ context, params }) => rememberCompany(context.person.id, params.companyId),
  // The switch only changes the company in the address, which the router calls staying.
  onStay: ({ context, params }) => rememberCompany(context.person.id, params.companyId),
  component: Outlet,
})
