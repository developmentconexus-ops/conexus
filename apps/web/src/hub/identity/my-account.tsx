import { useSuspenseQuery } from '@tanstack/react-query'
import { PageTitle } from '../../ui/list.tsx'
import { sessionQuery } from './queries.ts'

/** "Minha conta": who the person is in Conexus. The Hub has no write for the name yet. */
export function MyAccount() {
  const { data } = useSuspenseQuery(sessionQuery)
  if (data.state !== 'SIGNED_IN') return null
  const { person } = data
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle>Minha conta</PageTitle>
      <dl className="flex flex-col gap-md">
        <div className="flex flex-col gap-xs">
          <dt className="text-label text-text-2">Nome</dt>
          <dd>{person.name}</dd>
        </div>
        <div className="flex flex-col gap-xs">
          <dt className="text-label text-text-2">E-mail</dt>
          <dd>{person.email}</dd>
        </div>
      </dl>
    </div>
  )
}
