import { useSuspenseQuery } from '@tanstack/react-query'
import { SettingsSection } from '../../ui/settings-section.tsx'
import { sessionQuery } from './queries.ts'

/** "Minha conta": who the person is in Conexus. The Hub has no write for the name yet. */
export function MyAccount() {
  const { data } = useSuspenseQuery(sessionQuery)
  if (data.state !== 'SIGNED_IN') return null
  const { person } = data
  return (
    <SettingsSection
      id="profile"
      title="Perfil"
      description="Como você aparece para as pessoas da empresa."
    >
      <dl className="grid gap-lg sm:grid-cols-2">
        <div className="flex flex-col gap-xs">
          <dt className="text-label text-text-2">Nome</dt>
          <dd className="break-words">{person.name}</dd>
        </div>
        <div className="flex flex-col gap-xs">
          <dt className="text-label text-text-2">E-mail</dt>
          <dd className="break-all">{person.email}</dd>
        </div>
      </dl>
    </SettingsSection>
  )
}
