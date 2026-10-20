import { appHostOf, hostLabelOf } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { companyQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/general')

/** "Geral": the company's name, set by the Central, and its nickname, which does not change. */
export function CompanyGeneral() {
  const { companyId } = route.useParams()
  const { company } = useSuspenseQuery(companyQuery(companyId)).data
  const nickname = company.nickname
  const example = nickname === null ? undefined : hostLabelOf({ name: 'pedidos', nickname })
  return (
    <div className="flex flex-col gap-xl">
      <dl className="flex flex-col gap-md">
        <div className="flex flex-col gap-xs">
          <dt className="text-label text-text-2">Nome da empresa</dt>
          <dd>{company.name}</dd>
        </div>
        {nickname !== null && (
          <div className="flex flex-col gap-xs">
            <dt className="text-label text-text-2">Apelido</dt>
            <dd className="font-mono text-fact">{nickname}</dd>
            {example && (
              <dd className="text-label text-text-2">
                Exemplo de endereço:{' '}
                <span className="font-mono text-fact">
                  {appHostOf({ label: example, appsDomain: company.appsDomain })}
                </span>
              </dd>
            )}
          </div>
        )}
      </dl>
    </div>
  )
}
