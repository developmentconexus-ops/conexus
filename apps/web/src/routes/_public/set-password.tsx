import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import type { PasswordLinkKind } from '../../hub/identity/public.ts'
import { SameOriginPath, SetPasswordForm } from '../../hub/identity/public.ts'

/** The token rides in the fragment, which no request carries; a query token is ignored (S35). */
function tokenOf(hash: string): string | undefined {
  const token = z.string().min(1).safeParse(new URLSearchParams(hash).get('token'))
  return token.success ? token.data : undefined
}

/** A recovery link says so in its fragment; any other link is the first person's. */
function kindOf(hash: string): PasswordLinkKind {
  return new URLSearchParams(hash).get('kind') === 'recovery' ? 'recovery' : 'first'
}

const Search = z.object({ redirect: SameOriginPath.optional().catch(undefined) })

export const Route = createFileRoute('/_public/set-password')({
  validateSearch: Search,
  loader: ({ location }) => ({ token: tokenOf(location.hash), kind: kindOf(location.hash) }),
  component: SetPasswordPage,
})

function SetPasswordPage() {
  const { token, kind } = Route.useLoaderData()
  const { redirect } = Route.useSearch()
  return <SetPasswordForm token={token} kind={kind} redirect={redirect} />
}
