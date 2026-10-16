import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SameOriginPath, SignInForm } from '../../hub/identity/public.ts'

const Search = z.object({
  redirect: SameOriginPath.optional().catch(undefined),
  reason: z.enum(['signed-out', 'session-ended', 'password-set']).optional().catch(undefined),
})

export const Route = createFileRoute('/_public/login')({
  validateSearch: Search,
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  return <SignInForm reason={search.reason} redirect={search.redirect} />
}
