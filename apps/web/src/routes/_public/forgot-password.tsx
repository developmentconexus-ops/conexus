import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordForm } from '../../hub/identity/public.ts'

export const Route = createFileRoute('/_public/forgot-password')({
  component: ForgotPasswordForm,
})
