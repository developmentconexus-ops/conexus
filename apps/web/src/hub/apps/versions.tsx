import type { AppVersion, CompanyId, ProjectId } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { List, Row, rowBody, SectionTitle } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, NotFound, ReadFailure } from '../../ui/states.tsx'
import { Publish } from './publish.tsx'
import { versionsQuery } from './queries.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/**
 * The words of a version's state after its number, "Versão 1 · Na Prévia · Publicada"; a failed one
 * says why, from the failure table (web V35).
 */
function State({ version }: { version: AppVersion }) {
  if (version.state === 'sending') return <span className="text-text-2">· Enviando…</span>
  if (version.state === 'failed') {
    const why = version.failure === null ? undefined : FAILURES[version.failure].phrase
    return (
      <span className="text-danger">{why === undefined ? '· Falhou' : `· Falhou: ${why}`}</span>
    )
  }
  const marks = [version.live && 'Na Prévia', version.published && 'Publicada'].filter(Boolean)
  return marks.length === 0 ? null : <span className="text-fact">· {marks.join(' · ')}</span>
}

function VersionRow({
  version,
  ...props
}: Scope & { version: AppVersion; onStale: (message?: string) => void }) {
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
        {version.state === 'ready' && !version.published && (
          <Publish {...props} number={version.number} label="Publicar esta" />
        )}
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
 * The Versões of a Projeto's app, newest first, each under the number the Builder saved it as. A
 * read that fails shows its sentence and "Tentar de novo"; a Projeto the Hub does not find is the
 * not-found page.
 */
export function Versions(scope: Scope) {
  const read = useQuery(versionsQuery(scope.companyId, scope.projectId))
  const [stale, setStale] = useState<string>()
  if (read.error instanceof HubFailure && read.error.code === 'NOT_FOUND') return <NotFound />
  return (
    <section className="flex w-full max-w-column flex-col gap-lg">
      <SectionTitle>Versões</SectionTitle>
      {stale !== undefined && (
        <p role="alert" className="text-danger">
          {stale}
        </p>
      )}
      {read.isPending && <Loading />}
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {read.data?.versions.length === 0 && (
        <Empty>
          Nenhuma versão ainda. Cada versão que o Builder monta aparece aqui, e o app abre no
          endereço depois do primeiro Publicar.
        </Empty>
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
