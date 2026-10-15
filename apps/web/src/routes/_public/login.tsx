import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SignInForm } from '../../hub/identity/public.ts'

const ANY_ORIGIN = 'https://conexus.invalid'

/** A return address is a path on this origin, never another site (security S24, web W16). */
const SameOriginPath = z
  .string()
  .refine(
    (path) =>
      path.startsWith('/') &&
      !path.startsWith('//') &&
      !path.includes('\\') &&
      new URL(path, ANY_ORIGIN).origin === ANY_ORIGIN,
  )

const Search = z.object({
  redirect: SameOriginPath.optional().catch(undefined),
  reason: z.enum(['signed-out', 'session-ended']).optional().catch(undefined),
})

export const Route = createFileRoute('/_public/login')({
  validateSearch: Search,
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  return <SignInForm reason={search.reason} redirect={search.redirect} />
}
