import type { Project } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { ExternalLinkIcon, RotateCwIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { PageTitle } from '../../ui/list.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { Versions } from '../apps/public.ts'
import { About } from './project.tsx'
import { projectQuery } from './queries.ts'
import { Lens, Section } from './search.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')

/** Versões are read and put back by those the Hub lets manage them; the others are told who can. */
function VersionsSection() {
  const { companyId, projectId } = route.useParams()
  const { project } = useSuspenseQuery(projectQuery(companyId, projectId)).data
  return project.mayManageVersions ? (
    <Versions companyId={companyId} projectId={projectId} />
  ) : (
    <p className="text-text-2">
      Só o dono ou quem administra a empresa vê as versões e volta para uma delas.
    </p>
  )
}

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
 * The big region of a Projeto: the top line with its name, its tabs and **Abrir app**, and below the Prévia
 * (the route hands it in) or the Projeto's sections. The tab and the section live in the address.
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
  const live = project.address !== null && project.appVersion !== null
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
      <div className="flex flex-wrap items-center gap-x-md gap-y-xs border-b border-line px-md py-xs max-md:flex-nowrap max-md:gap-x-xs max-md:px-xs max-md:py-0">
        <PageTitle className="min-w-0 flex-[1_1_16rem] truncate max-md:hidden" title={project.name}>
          {project.name}
        </PageTitle>
        <TabsList aria-label="Projeto">
          <TabsTrigger value={Lens.enum.preview}>Prévia</TabsTrigger>
          <TabsTrigger value={Lens.enum.code}>Código</TabsTrigger>
          <TabsTrigger value={Lens.enum.project}>Projeto</TabsTrigger>
        </TabsList>
        {live && lens === Lens.enum.preview && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:hidden"
            aria-label="Recarregar"
            onClick={reload}
          >
            <RotateCwIcon aria-hidden="true" />
          </Button>
        )}
        {live && (
          <a
            href={`https://${project.address}/`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir app"
            className={cn(
              buttonVariants({ variant: 'primary', phoneIcon: true }),
              'ml-auto max-md:ml-0',
              lens !== Lens.enum.preview && 'max-md:ml-auto',
            )}
          >
            <ExternalLinkIcon className="md:hidden" aria-hidden="true" />
            <span className="max-md:hidden">Abrir app</span>
          </a>
        )}
      </div>
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
