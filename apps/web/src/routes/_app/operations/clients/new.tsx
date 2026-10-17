import { createFileRoute } from '@tanstack/react-router'
import { operatorOnly, RegisterClientForm } from '../../../../hub/operations/public.ts'

export const Route = createFileRoute('/_app/operations/clients/new')({
  beforeLoad: operatorOnly,
  staticData: { place: 'Cadastrar cliente' },
  component: RegisterClientForm,
})
