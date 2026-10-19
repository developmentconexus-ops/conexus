import { SignInKind } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { SectionTitle } from '../../ui/list.tsx'
import { kindsQuery, sendKinds } from './queries.ts'
import { KIND_NAMES, refusalText } from './text.ts'

const route = getRouteApi('/_app/operations/clients/$companyId')

/**
 * "Tipos de conta" of a client, for the operator: the API key is always open, and each sign-in
 * kind is a toggle that sends the final list of open kinds.
 */
export function AccountKinds() {
  const { companyId } = route.useParams()
  const { kinds } = useSuspenseQuery(kindsQuery(companyId)).data
  const send = useMutation(sendKinds)

  function toggle(kind: SignInKind) {
    const open = kinds.includes(kind) ? kinds.filter((one) => one !== kind) : [...kinds, kind]
    send.mutate({
      params: { companyId },
      body: { kinds: SignInKind.options.filter((one) => open.includes(one)) },
    })
  }

  return (
    <section aria-label="Tipos de conta" className="flex flex-col gap-lg">
      <SectionTitle>Tipos de conta</SectionTitle>
      <ul className="flex flex-col gap-sm">
        <li>{`${KIND_NAMES.api_key} · sempre ligada`}</li>
        {SignInKind.options.map((kind) => (
          <li key={kind}>
            <label className="flex items-center gap-sm">
              <input
                type="checkbox"
                checked={kinds.includes(kind)}
                disabled={send.isPending}
                onChange={() => toggle(kind)}
              />
              {KIND_NAMES[kind]}
            </label>
          </li>
        ))}
      </ul>
      {send.isError && (
        <p role="alert" className="text-danger">
          {refusalText(send.error)}
        </p>
      )}
    </section>
  )
}
