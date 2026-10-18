import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { PageTitle } from '../../ui/list.tsx'
import { Notice } from '../../ui/notice.tsx'
import { openAppHandoff } from './queries.ts'

const route = getRouteApi('/_app/apps/open')
const NO_SUCH_APP = 'Este app não existe ou você não tem acesso a ele.'

/**
 * Where "Abrir app" and the dispatcher's first visit land: asks the Hub for a pass once and goes to
 * the app's host with it. The binding and the pass are never shown or logged (security S41).
 */
export function OpenApp() {
  const { host, binding } = route.useSearch()
  const send = useMutation(openAppHandoff)
  const [failure, setFailure] = useState<unknown>()
  const started = useRef(false)

  async function open() {
    if (host === undefined || binding === undefined) return
    try {
      const { location } = await send.mutateAsync({ body: { host, binding } })
      globalThis.location.assign(location)
    } catch (error) {
      setFailure(error)
    }
  }

  // One pass for the visit: the StrictMode remount does not ask a second time.
  useEffect(() => {
    if (started.current) return
    started.current = true
    void open()
  })

  const refused = host === undefined || binding === undefined || isNotFound(failure)
  return (
    <div className="flex flex-col gap-lg">
      <PageTitle>Abrir app</PageTitle>
      {refused && <p role="alert">{NO_SUCH_APP}</p>}
      {!refused && failure === undefined && <Notice>Abrindo o app…</Notice>}
      {/* The failure's row says what to do; none of this operation's rows asks to retry. */}
      {!refused && failure !== undefined && <p role="alert">{sentenceOf(failure)}</p>}
    </div>
  )
}

function isNotFound(failure: unknown): boolean {
  return failure instanceof HubFailure && failure.code === 'NOT_FOUND'
}
