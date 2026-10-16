import { createFileRoute, useLocation } from '@tanstack/react-router'
import { z } from 'zod'
import { SameOriginPath, SetPasswordForm } from '../../hub/identity/public.ts'

/** The token rides in the fragment, which no request carries; a query token is ignored (S35). */
function tokenOf(hash: string): string | undefined {
  const token = z.string().min(1).safeParse(new URLSearchParams(hash).get('token'))
  return token.success ? token.data : undefined
}

const Search = z.object({ redirect: SameOriginPath.optional().catch(undefined) })

export const Route = createFileRoute('/_public/set-password')({
  validateSearch: Search,
  component: SetPasswordPage,
})

function SetPasswordPage() {
  const hash = useLocation({ select: (location) => location.hash })
  const { redirect } = Route.useSearch()
  return <SetPasswordForm token={tokenOf(hash)} redirect={redirect} />
}
