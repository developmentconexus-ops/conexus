import type { ProjectSource } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Skeleton } from '../../ui/skeleton.tsx'
import { fileQuery, sourceQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')

function Waiting({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-sm">
      <Skeleton className="w-1/2" />
      <Skeleton className="w-2/3" />
      <Skeleton className="w-1/3" />
    </div>
  )
}

function FileText(props: { commit: string; path: string }) {
  const { companyId, projectId } = route.useParams()
  const text = useQuery({ ...fileQuery({ companyId, projectId, ...props }), retry: false })
  if (text.isPending) return <Waiting label="Carregando o arquivo" />
  if (text.isError) return <p role="alert">{sentenceOf(text.error)}</p>
  return (
    // A scrolling region: current browsers let the keyboard focus it, so no tabindex is set.
    <section
      aria-label={`Conteúdo de ${props.path}`}
      className="min-w-0 overflow-auto rounded-control bg-surface-3 p-sm"
    >
      <pre className="font-mono text-fact text-text">{text.data.text}</pre>
    </section>
  )
}

function Files(props: { source: ProjectSource; commit: string }) {
  const { source, commit } = props
  const [chosen, setChosen] = useState<string>()
  const path = source.files.some((file) => file.path === chosen) ? chosen : source.files[0]?.path
  return (
    <div className="grid min-h-0 gap-md md:grid-cols-[16rem_1fr]">
      <ul aria-label="Arquivos do app" className="flex min-w-0 flex-col gap-xs">
        {source.files.map((file) => (
          <li key={file.path}>
            <button
              type="button"
              aria-current={file.path === path ? 'true' : undefined}
              onClick={() => setChosen(file.path)}
              className={cn(
                'w-full truncate rounded-control px-sm py-xs text-left font-mono text-fact hover:bg-surface-3',
                file.path === path && 'bg-surface-3 text-text',
              )}
            >
              {file.path}
            </button>
          </li>
        ))}
      </ul>
      {path !== undefined && <FileText commit={commit} path={path} />}
    </div>
  )
}

/**
 * The Código tab: the files of the Projeto's current version, read from the Hub's own Git, one at
 * a time. It reads again when the stream says a version was saved.
 */
export function Source() {
  const { companyId, projectId } = route.useParams()
  const read = useQuery(sourceQuery(companyId, projectId))
  if (read.isPending) return <Waiting label="Carregando o código" />
  if (read.isError) {
    return (
      <div className="flex flex-col items-start gap-md">
        <p role="alert">{sentenceOf(read.error)}</p>
        <Button variant="primary" onClick={() => void read.refetch()}>
          Tentar de novo
        </Button>
      </div>
    )
  }
  const source = read.data
  const { commit, savedAt } = source
  if (commit === null || savedAt === null) {
    return (
      <p className="text-text-2">
        Ainda não há código. O Builder escreve aqui quando você descreve o aplicativo.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-md">
      <p className="text-text-2">
        Versão {source.version}, guardada em {dayAndHour(savedAt)}
      </p>
      <Files source={source} commit={commit} />
    </div>
  )
}
