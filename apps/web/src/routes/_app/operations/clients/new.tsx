import { createFileRoute } from '@tanstack/react-router'
import { RegisterClientForm } from '../../../../hub/operations/public.ts'

export const Route = createFileRoute('/_app/operations/clients/new')({
  staticData: { place: 'Cadastrar cliente' },
  component: RegisterClientForm,
})
