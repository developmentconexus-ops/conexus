import { createFileRoute } from '@tanstack/react-router'
import { StatusPage } from '../../../hub/status/public.ts'

export const Route = createFileRoute('/_app/operations/status')({
  staticData: { place: 'Estado do Hub' },
  component: StatusPage,
})
