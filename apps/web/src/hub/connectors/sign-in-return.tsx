import type { SignInCompleted } from '@conexus/hub-api'
import { CompanyId, ConnectionSignInId } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ConexusWordmark } from '../../brand/mark.tsx'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { buttonVariants } from '../../ui/button.tsx'
import { connectionsPrefix, sendSignInEnd } from './queries.ts'
import { Said } from './test-result.tsx'
import { BACK_TO_INTEGRATIONS, NOT_A_SIGN_IN_TEXT, RETURNING_TEXT, signInEndText } from './text.ts'

const route = getRouteApi('/_app/integrations/return')

export const RETURN_PATH = '/integrations/return'

/** What the provider's address brought back: the company and the authorization from `state`, then the code or the refusal. */
type Arrival =
  | { kind: 'UNKNOWN' }
  | {
      kind: 'KNOWN'
      companyId: CompanyId
      signInId: ConnectionSignInId
      body: { code: string } | { refused: true }
    }

/** `state` is the company and the authorization, `<companyId>.<signInId>`; anything else is not one of ours. */
function arrivalOf(search: { code?: string; state?: string; error?: string }): Arrival {
  const [company, signIn, ...rest] = (search.state ?? '').split('.')
  const companyId = CompanyId.safeParse(company)
  const signInId = ConnectionSignInId.safeParse(signIn)
  if (!companyId.success || !signInId.success || rest.length > 0) return { kind: 'UNKNOWN' }
  const base = { kind: 'KNOWN', companyId: companyId.data, signInId: signInId.data } as const
  if (search.error !== undefined) return { ...base, body: { refused: true } }
  if (search.code !== undefined) return { ...base, body: { code: search.code } }
  return { kind: 'UNKNOWN' }
}

function Page(props: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-lg pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex max-w-message flex-col items-center gap-lg text-center">
        <ConexusWordmark />
        {props.children}
      </div>
    </main>
  )
}

function Back(props: { companyId: CompanyId | null }) {
  return props.companyId === null ? (
    <Link to="/" className={buttonVariants()}>
      {BACK_TO_INTEGRATIONS}
    </Link>
  ) : (
    <Link
      to="/companies/$companyId/integrations"
      params={{ companyId: props.companyId }}
      className={buttonVariants()}
    >
      {BACK_TO_INTEGRATIONS}
    </Link>
  )
}

function Ended(props: {
  companyId: CompanyId | null
  answer: Exclude<SignInCompleted, { result: 'LINKED' }>
}) {
  const { answer } = props
  return (
    <>
      <p role="alert" className="text-danger">
        {signInEndText(answer)}
      </p>
      {'native' in answer && answer.native !== null && (
        <Said native={answer.native} name={answer.connector} />
      )}
      <Back companyId={props.companyId} />
    </>
  )
}

/**
 * Where the provider sends the person back after an authorization (`/integrations/return`): it
 * reads `code`, `state` and `error` once, takes them out of the address in the history before the
 * Hub is called, so going back never sends the code again, and completes the authorization (web
 * W1, code C36: the page changes nothing by itself, the Hub's POST does). A linked connection opens
 * its page, which tests it.
 */
export function SignInReturn() {
  const search = route.useSearch()
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [arrival] = useState(() => arrivalOf(search))
  const end = useMutation(sendSignInEnd)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    router.history.replace(RETURN_PATH)
    if (arrival.kind === 'UNKNOWN') return
    const { companyId, signInId, body } = arrival
    end.mutate(
      { params: { companyId, signInId }, body },
      {
        onSuccess: (answer) => {
          if (answer.result !== 'LINKED') return
          void queryClient.invalidateQueries({ queryKey: connectionsPrefix(companyId) })
          void navigate({
            to: '/companies/$companyId/integrations/$connectionId',
            params: { companyId, connectionId: answer.connection.id },
            search: { testar: true },
            replace: true,
          })
        },
      },
    )
  }, [arrival, end.mutate, navigate, queryClient, router])

  const companyId = arrival.kind === 'KNOWN' ? arrival.companyId : null
  if (arrival.kind === 'UNKNOWN' || isNotOurs(end.error)) {
    return (
      <Page>
        <p role="alert" className="text-danger">
          {NOT_A_SIGN_IN_TEXT}
        </p>
        <Back companyId={companyId} />
      </Page>
    )
  }
  if (end.error !== null) {
    return (
      <Page>
        <p role="alert" className="text-danger">
          {sentenceOf(end.error)}
        </p>
        <Back companyId={companyId} />
      </Page>
    )
  }
  if (end.data && end.data.result !== 'LINKED') {
    return (
      <Page>
        <Ended companyId={companyId} answer={end.data} />
      </Page>
    )
  }
  return (
    <Page>
      <p role="status" className="text-text-2">
        {RETURNING_TEXT}
      </p>
    </Page>
  )
}

/** The Hub's 404 for a company or an authorization that is not the person's: the address is not one of theirs. */
function isNotOurs(error: unknown) {
  return error instanceof HubFailure && error.code === 'NOT_FOUND'
}
