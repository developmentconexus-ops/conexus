import type { AppVersion, CompanyId, ProjectId } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { List, Row, rowBody, SectionTitle } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, NotFound } from '../../ui/states.tsx'
import { PutBack } from './put-back.tsx'
import { versionsQuery } from './queries.ts'
import { SendVersion } from './send-version.tsx'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/**
 * The words of a version's state after its number, "Versão 1 · no ar"; a failed one says why, from
 * the failure table (web V35).
 */
function State({ version }: { version: AppVersion }) {
  if (version.live) return <span className="text-fact">· no ar</span>
  if (version.state === 'sending') return <span className="text-text-2">· Enviando…</span>
  if (version.state === 'ready') return null
  const why = version.failure === null ? undefined : FAILURES[version.failure].phrase
  return <span className="text-danger">{why === undefined ? '· Falhou' : `· Falhou: ${why}`}</span>
}

function VersionRow(props: Scope & { version: AppVersion; onStale: (message?: string) => void }) {
  const { version } = props
  return (
    <Row>
      <div className={rowBody({ kind: 'wrapping' })}>
        <span className="flex min-w-0 flex-col">
          <span>
            Versão {version.number} <State version={version} />
          </span>
          <span className="text-label text-text-2">
            {dayAndHour(version.createdAt)}
            {version.sentByName !== null && ` · ${version.sentByName}`}
          </span>
        </span>
        {version.state === 'ready' && !version.live && <PutBack {...props} />}
      </div>
    </Row>
  )
}

function Loading() {
  return (
    <div className="flex flex-col gap-md">
      <span className="sr-only" role="status">
        Carregando as versões…
      </span>
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
    </div>
  )
}

/**
 * The Versões of a Projeto's app, newest first, and "Enviar versão". A read that fails shows its
 * sentence and "Tentar de novo"; a Projeto the Hub does not find is the not-found page.
 */
export function Versions(scope: Scope) {
  const read = useQuery(versionsQuery(scope.companyId, scope.projectId))
  const [stale, setStale] = useState<string>()
  if (read.error instanceof HubFailure && read.error.code === 'NOT_FOUND') return <NotFound />
  return (
    <section className="flex w-full max-w-column flex-col gap-lg">
      <SectionTitle>Versões</SectionTitle>
      <SendVersion {...scope} />
      {stale !== undefined && (
        <p role="alert" className="text-danger">
          {stale}
        </p>
      )}
      {read.isPending && <Loading />}
      {read.isError && (
        <div className="flex flex-col items-start gap-md">
          <p role="alert" className="text-danger">
            {sentenceOf(read.error)}
          </p>
          <Button onClick={() => void read.refetch()}>Tentar de novo</Button>
        </div>
      )}
      {read.data?.versions.length === 0 && (
        <Empty>Nenhuma versão enviada. O endereço mostra o app de exemplo.</Empty>
      )}
      {read.data !== undefined && read.data.versions.length > 0 && (
        <List>
          {read.data.versions.map((version) => (
            <VersionRow key={version.id} {...scope} version={version} onStale={setStale} />
          ))}
        </List>
      )}
    </section>
  )
}
