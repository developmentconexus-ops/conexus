import { appHostOf, hostLabelOf } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { SettingsSection } from '../../ui/settings-section.tsx'
import { companyQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/general')

/** "Geral": the company's name, set by the Central, and its nickname, which does not change. */
export function CompanyGeneral() {
  const { companyId } = route.useParams()
  const { company } = useSuspenseQuery(companyQuery(companyId)).data
  const nickname = company.nickname
  const example = nickname === null ? undefined : hostLabelOf({ name: 'pedidos', nickname })
  return (
    <div className="flex flex-col gap-2xl">
      <SettingsSection id="name" title="Nome" description="Definido pela Central.">
        <p className="break-words">{company.name}</p>
      </SettingsSection>
      {nickname !== null && (
        <SettingsSection
          id="nickname"
          title="Apelido"
          description="Entra no endereço de cada app da empresa e não muda."
        >
          <p className="font-mono text-fact">{nickname}</p>
          {example && (
            <p className="text-label text-text-2">
              Exemplo de endereço:{' '}
              <span className="break-all font-mono text-fact text-text">
                {appHostOf({ label: example, appsDomain: company.appsDomain })}
              </span>
            </p>
          )}
        </SettingsSection>
      )}
    </div>
  )
}
