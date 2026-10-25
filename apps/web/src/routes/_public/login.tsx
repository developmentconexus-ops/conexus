import { InvitationId } from '@conexus/hub-api'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import {
  goBack,
  receivedInvitationQuery,
  SameOriginPath,
  SignInForm,
  sessionQuery,
} from '../../hub/identity/public.ts'

const Search = z.object({
  redirect: SameOriginPath.optional().catch(undefined),
  reason: z
    .enum(['signed-out', 'session-ended', 'password-set', 'password-changed'])
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/_public/login')({
  validateSearch: Search,
  // Someone already signed in has nothing to do here: an old link, or one that wrapped itself in
  // its own redirect, takes them on to where it pointed (web W15).
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (session.state === 'SIGNED_IN') {
      throw redirect(goBack(search.redirect ?? '/'))
    }
  },
  loaderDeps: ({ search }) => ({ redirect: search.redirect }),
  loader: async ({ context, deps }) => {
    const id = InvitationId.safeParse(
      deps.redirect?.match(/^\/invitations\/([A-Za-z0-9]{32})$/)?.[1],
    )
    if (!id.success) return { email: '' }
    const { invitation } = await context.queryClient.fetchQuery(receivedInvitationQuery(id.data))
    return {
      email:
        invitation.kind === 'NEW' || invitation.kind === 'HAS_PASSWORD' ? invitation.email : '',
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  const { email } = Route.useLoaderData()
  return <SignInForm reason={search.reason} redirect={search.redirect} email={email} />
}
