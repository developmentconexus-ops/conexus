import type { CompanyId, CompanyNetworkDomain } from '@conexus/hub-api'
import { DEVELOPMENT_HOSTS } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { ActionDialog, companyQuery, isGone } from '../../hub/identity/public.ts'
import { dayOf } from '../../platform/dates.ts'
import { List, Row, rowBody, SettingsPageTitle } from '../../ui/list.tsx'
import { SettingsSection } from '../../ui/settings-section.tsx'
import { Empty, Loading, RouteReadFailure } from '../../ui/states.tsx'
import { AddDomain } from './add-domain.tsx'
import { Fact, StarCoverage } from './domain-words.tsx'
import { OpenAll } from './open-all.tsx'
import { networkDomainsQuery, openAllNetworkQuery, removeNetworkDomainMutation } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/network')

function RemoveDomain({ companyId, row }: { companyId: CompanyId; row: CompanyNetworkDomain }) {
  const [open, setOpen] = useState(false)
  const send = useMutation(removeNetworkDomainMutation)
  function remove() {
    send.mutate(
      { params: { companyId, domainId: row.id } },
      { onSuccess: () => setOpen(false), onError: (error) => isGone(error) && setOpen(false) },
    )
  }
  return (
    <ActionDialog
      open={open}
      onOpenChange={setOpen}
      trigger={{ label: 'Remover', name: `Remover ${row.domain}`, danger: true }}
      title={`Tirar ${row.domain} da lista?`}
      description="As máquinas ligadas deixam de alcançar este domínio em segundos. Uma conversa que liberou o mesmo domínio continua alcançando."
      confirm={{ label: 'Remover', pending: 'Removendo…' }}
      write={send}
      onConfirm={remove}
    />
  )
}

function grantedLine({ grantedBy, grantedAt }: CompanyNetworkDomain): string {
  const day = dayOf(grantedAt)
  return grantedBy === null ? `Liberado em ${day}` : `Liberado por ${grantedBy} em ${day}`
}

function DomainRow(props: { companyId: CompanyId; row: CompanyNetworkDomain; may: boolean }) {
  const { row } = props
  return (
    <Row>
      <div className={rowBody({ kind: 'wrapping' })}>
        <div className="flex min-w-0 flex-1 flex-col gap-xs wrap-anywhere">
          <span className="font-mono text-fact font-semibold">{row.domain}</span>
          {row.domain.startsWith('*.') && (
            <span className="text-label text-text-2">
              <StarCoverage base={row.domain.slice(2)} />
            </span>
          )}
          <span className="text-label text-text-2">{row.reason}</span>
          <span className="text-label text-text-2">{grantedLine(row)}</span>
        </div>
        {props.may && <RemoveDomain companyId={props.companyId} row={row} />}
      </div>
    </Row>
  )
}

function CompanyDomains({ companyId, may }: { companyId: CompanyId; may: boolean }) {
  const { domains } = useSuspenseQuery(networkDomainsQuery(companyId)).data
  const { open } = useSuspenseQuery(openAllNetworkQuery(companyId)).data
  return (
    <SettingsSection
      id="company-domains"
      title="Lista da empresa"
      description="Sites que as máquinas alcançam além dos que vêm com o Conexus."
    >
      {open !== null && (
        <p className="border-warning border-l-2 pl-sm">
          Com a internet toda ligada, esta lista não limita as máquinas.
        </p>
      )}
      {may ? (
        <div>
          <AddDomain companyId={companyId} />
        </div>
      ) : (
        <p className="text-text-2">Só o dono ou um administrador adiciona ou tira domínios.</p>
      )}
      {domains.length === 0 ? (
        <Empty>Nenhum domínio liberado.</Empty>
      ) : (
        <List>
          {domains.map((row) => (
            <DomainRow key={row.id} companyId={companyId} row={row} may={may} />
          ))}
        </List>
      )}
    </SettingsSection>
  )
}

export function NetworkSettings() {
  const { companyId } = route.useParams()
  const { may } = useSuspenseQuery(companyQuery(companyId)).data
  return (
    <div className="flex flex-col gap-2xl">
      <SettingsSection
        id="development"
        title="Vem com o Conexus"
        description="Toda máquina alcança estes endereços: os registros do npm e do PyPI, o GitHub e os espelhos do Debian."
      >
        <List>
          {DEVELOPMENT_HOSTS.map((host) => (
            <Row key={host}>
              <div className={rowBody({ kind: 'wrapping' })}>
                <Fact>{host}</Fact>
              </div>
            </Row>
          ))}
        </List>
      </SettingsSection>
      <OpenAll companyId={companyId} may={may.openAllNetwork} />
      <CompanyDomains companyId={companyId} may={may.manageNetwork} />
    </div>
  )
}

function UnopenedSection({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-xl">
      <SettingsPageTitle>Internet</SettingsPageTitle>
      {children}
    </div>
  )
}

export function NetworkPending() {
  return (
    <UnopenedSection>
      <Loading />
    </UnopenedSection>
  )
}

export function NetworkReadFailure(props: ErrorComponentProps) {
  return (
    <UnopenedSection>
      <RouteReadFailure {...props} />
    </UnopenedSection>
  )
}
