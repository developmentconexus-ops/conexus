import { createFileRoute, useLocation } from '@tanstack/react-router'
import { z } from 'zod'
import { SetPasswordForm } from '../../hub/identity/public.ts'

/** The token rides in the fragment, which no request carries; a query token is ignored (S35). */
function tokenOf(hash: string): string | undefined {
  const token = z.string().min(1).safeParse(new URLSearchParams(hash).get('token'))
  return token.success ? token.data : undefined
}

export const Route = createFileRoute('/_public/set-password')({ component: SetPasswordPage })

function SetPasswordPage() {
  const hash = useLocation({ select: (location) => location.hash })
  return <SetPasswordForm token={tokenOf(hash)} />
}
