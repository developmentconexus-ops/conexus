import type { AppTables, CompanyId, ProjectSummary } from '@conexus/hub-api'
import type { UseQueryResult } from '@tanstack/react-query'
import { useInfiniteQuery, useQueries } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { appTablesQuery, countText } from '../apps/public.ts'
import { projectsPagedQuery } from '../projects/public.ts'
import {
  APPS_COLUMNS,
  APPS_EMPTY,
  APPS_INTRO,
  MORE_PROJECTS,
  OPEN_PROJECT,
  systemText,
  versionText,
} from './text.ts'

type AppProject = ProjectSummary & { appVersion: number }

function hasApp(project: ProjectSummary): project is AppProject {
  return project.appVersion !== null
}

/** The tables the app keeps itself: the copies released to the Projeto are in Bruto already. */
function appTablesOf(data: AppTables) {
  return data.kind === 'NO_APP' ? [] : data.tables.filter((table) => table.schema === 'APP')
}

function GroupHead(props: { companyId: CompanyId; project: AppProject; title: string }) {
  const { companyId, project, title } = props
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-md">
      <h2 className="font-medium">{title}</h2>
      <Link
        to="/companies/$companyId/projects/$projectId/data"
        params={{ companyId, projectId: project.id }}
        className="text-text-2 underline underline-offset-2"
      >
        {OPEN_PROJECT}
      </Link>
    </div>
  )
}

function ProjectGroup(props: {
  companyId: CompanyId
  project: AppProject
  read: UseQueryResult<AppTables>
}) {
  const { companyId, project, read } = props
  if (read.isPending) return <Skeleton className="h-16 w-full" />
  if (read.isError) {
    return (
      <section aria-label={project.name} className="flex flex-col gap-sm">
        <GroupHead companyId={companyId} project={project} title={project.name} />
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      </section>
    )
  }
  const tables = appTablesOf(read.data)
  if (tables.length === 0) return null
  return (
    <section aria-label={project.name} className="flex flex-col gap-sm">
      <GroupHead
        companyId={companyId}
        project={project}
        title={systemText(project.name, [], tables.length)}
      />
      <Table>
        <TableHeader>
          <TableRow>
            {APPS_COLUMNS.map((head) => (
              <TableHead key={head} className={head === 'Linhas' ? 'text-right' : undefined}>
                {head}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tables.map((table) => (
            <TableRow key={table.name}>
              <TableCell className="font-mono text-fact">{table.name}</TableCell>
              <TableCell>{versionText(project)}</TableCell>
              <TableCell className="text-right tabular-nums">{countText(table.rows)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

/**
 * The **Apps** layer of Dados: the tables each app of the company keeps, by Projeto, with the version
 * they belong to and their row counts, for reading only. The Projetos come a page at a time and the
 * next page only when the person asks (**Mais Projetos**); a Projeto that fails to answer says so in
 * its own group.
 */
export function AppsLayer({ companyId }: { companyId: CompanyId }) {
  const projects = useInfiniteQuery(projectsPagedQuery(companyId))
  const withApp = (projects.data?.pages ?? []).flatMap((page) => page.projects).filter(hasApp)
  const reads = useQueries({ queries: withApp.map((one) => appTablesQuery(companyId, one.id)) })
  if (projects.isPending) return <Skeleton className="h-24 w-full" />
  if (projects.isError && withApp.length === 0) {
    return <ReadFailure text={sentenceOf(projects.error)} onRetry={() => void projects.refetch()} />
  }
  const nothing = reads.every((read) => read.isSuccess && appTablesOf(read.data).length === 0)
  return (
    <div className="flex flex-col gap-lg">
      <p className="text-text-2">{APPS_INTRO}</p>
      {nothing && !projects.hasNextPage && <Empty>{APPS_EMPTY}</Empty>}
      {withApp.flatMap((project, at) => {
        const read = reads[at]
        return read === undefined
          ? []
          : [<ProjectGroup key={project.id} companyId={companyId} project={project} read={read} />]
      })}
      {projects.hasNextPage && (
        <Button
          className="self-start"
          disabled={projects.isFetchingNextPage}
          onClick={() => void projects.fetchNextPage()}
        >
          {MORE_PROJECTS}
        </Button>
      )}
      {projects.isError && <Alert tone="danger">{sentenceOf(projects.error)}</Alert>}
    </div>
  )
}
