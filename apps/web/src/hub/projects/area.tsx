import type { Project } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { ExternalLinkIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { buttonVariants } from '../../ui/button.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { Publish, Versions } from '../apps/public.ts'
import { About } from './project.tsx'
import { projectQuery } from './queries.ts'
import { Lens, Section } from './search.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')

/** Every member reads the Versões and publishes one (step 17, E1). */
function VersionsSection() {
  const { companyId, projectId } = route.useParams()
  return <Versions companyId={companyId} projectId={projectId} />
}

// The three tabs are tight under `md`, so that Publicar and Abrir app fit beside them at 320px.
const LENSES = [
  [Lens.enum.preview, 'Prévia'],
  [Lens.enum.code, 'Código'],
  [Lens.enum.project, 'Projeto'],
] as const

function Sections() {
  const { section = Section.enum.about } = route.useSearch()
  const navigate = useNavigate()
  return (
    <Tabs
      value={section}
      onValueChange={(next) => {
        const section = Section.safeParse(next)
        if (section.success)
          void navigate({
            to: '.',
            search: (previous) => ({ ...previous, section: section.data }),
          })
      }}
    >
      <TabsList aria-label="Seções do Projeto">
        <TabsTrigger value={Section.enum.about}>Sobre</TabsTrigger>
        <TabsTrigger value={Section.enum.versions}>Versões</TabsTrigger>
      </TabsList>
      <TabsContent value={Section.enum.about}>
        <About />
      </TabsContent>
      <TabsContent value={Section.enum.versions}>
        <VersionsSection />
      </TabsContent>
    </Tabs>
  )
}

/**
 * The big region of a Projeto: the top line with its name, its tabs, **Publicar** (or the version
 * published) and **Abrir app**, and below the Prévia (the route hands it in) or the Projeto's
 * sections. The tab and the section live in the address.
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
      <div className="flex flex-wrap items-center gap-x-md gap-y-xs border-b border-line px-md py-xs max-md:flex-nowrap max-md:gap-x-md max-md:px-sm max-md:py-0">
        <PageTitle className="min-w-0 flex-[1_1_16rem] truncate max-md:hidden" title={project.name}>
          {project.name}
        </PageTitle>
        <TabsList aria-label="Projeto" className="max-md:gap-0">
          {LENSES.map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="max-md:px-sm max-md:after:inset-x-sm">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="ml-auto flex items-center gap-md">
          {appVersion !== null && (
            <span className="text-label text-text-2 max-md:sr-only">
              Versão {appVersion} ·{' '}
              {appVersion === publishedVersion ? 'publicada' : 'não publicada'}
            </span>
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
      <TabsContent value={Lens.enum.project} className="min-h-0 overflow-y-auto p-xl">
        <Sections />
      </TabsContent>
    </Tabs>
  )
}
