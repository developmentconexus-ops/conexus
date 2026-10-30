import type { Project } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { ExternalLinkIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Badge } from '../../ui/badge.tsx'
import { buttonVariants } from '../../ui/button.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { Publish } from '../apps/public.ts'
import { projectQuery } from './queries.ts'
import { Lens } from './search.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')

// The two tabs are tight under `md`, so that Publicar and Abrir app fit beside them at 320px.
const LENSES = [
  [Lens.enum.preview, 'Prévia'],
  [Lens.enum.code, 'Código'],
] as const

/**
 * The big region of the Construir: the top line with its tabs (the name is at the head of the sidebar), **Publicar** (or
 * the version published) and **Abrir app**, and below the Prévia (the route hands it in) or the
 * Código. The tab lives in the address.
 */
export function ProjectArea(props: {
  preview: (project: Project, reloads: number, reload: () => void) => ReactNode
  code: ReactNode
}) {
  const { companyId, projectId } = route.useParams()
  const { lens = Lens.enum.preview } = route.useSearch()
  const navigate = useNavigate()
  const { project } = useSuspenseQuery(projectQuery(companyId, projectId)).data
  const [reloads, setReloads] = useState(0)
  function reload() {
    setReloads((count) => count + 1)
  }
  const { address, appVersion, publishedVersion } = project
  const live = address !== null && appVersion !== null
  const [stale, setStale] = useState<string>()
  const isMobile = useIsMobile()
  return (
    <Tabs
      value={lens}
      onValueChange={(next) => {
        const chosen = Lens.safeParse(next)
        if (chosen.success)
          void navigate({ to: '.', search: (previous) => ({ ...previous, lens: chosen.data }) })
      }}
      className="h-full gap-0"
    >
      <div className="flex h-12 items-center gap-md border-b border-line px-md max-md:h-auto max-md:px-sm">
        <TabsList aria-label="Projeto" className="max-md:gap-0">
          {LENSES.map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="max-md:px-sm max-md:after:inset-x-sm">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <PageTitle className="sr-only max-md:hidden" title={project.name}>
          {project.name}
        </PageTitle>
        <div className="ml-auto flex items-center gap-sm">
          {appVersion !== null && (
            <Badge
              tone={appVersion === publishedVersion ? 'success' : 'neutral'}
              className="max-md:sr-only"
            >
              Versão {appVersion} ·{' '}
              {appVersion === publishedVersion ? 'publicada' : 'não publicada'}
            </Badge>
          )}
          {address !== null &&
            publishedVersion !== null &&
            !(live && lens === Lens.enum.preview && isMobile) && (
              <a
                href={`https://${address}/`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir app"
                className={buttonVariants({ phoneIcon: true })}
              >
                <ExternalLinkIcon className="md:hidden" aria-hidden="true" />
                <span className="max-md:hidden">Abrir app</span>
              </a>
            )}
          {appVersion !== null && appVersion !== publishedVersion && (
            <Publish
              companyId={companyId}
              projectId={projectId}
              number={appVersion}
              label="Publicar"
              onStale={setStale}
            />
          )}
        </div>
      </div>
      {stale !== undefined && (
        <p role="alert" className="border-b border-line px-md py-xs text-danger">
          {stale}
        </p>
      )}
      <TabsContent value={Lens.enum.preview} className="min-h-0">
        {props.preview(project, reloads, reload)}
      </TabsContent>
      <TabsContent value={Lens.enum.code} className="min-h-0 overflow-y-auto p-xl">
        {props.code}
      </TabsContent>
    </Tabs>
  )
}
