import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { buttonVariants } from '../../ui/button.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { Versions } from '../apps/public.ts'
import { About } from './project.tsx'
import { projectQuery } from './queries.ts'
import { Lens, Section } from './search.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')

/** Versões are read and sent by those the Hub lets manage them; the others are told who can. */
function VersionsSection() {
  const { companyId, projectId } = route.useParams()
  const { project } = useSuspenseQuery(projectQuery(companyId, projectId)).data
  return project.mayManageVersions ? (
    <Versions companyId={companyId} projectId={projectId} />
  ) : (
    <p className="text-text-2">Só o dono ou quem administra a empresa vê e envia as versões.</p>
  )
}

function Sections() {
  const { section = Section.enum.about } = route.useSearch()
  const navigate = route.useNavigate()
  return (
    <Tabs
      value={section}
      onValueChange={(next) => {
        const section = Section.safeParse(next)
        if (section.success)
          void navigate({ search: (previous) => ({ ...previous, section: section.data }) })
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
 * The big region of a Projeto: the top line with its tabs and **Abrir app**, and below the Prévia
 * (the route hands it in) or the Projeto's sections. The tab and the section live in the address.
 */
export function ProjectArea(props: { preview: ReactNode }) {
  const { companyId, projectId } = route.useParams()
  const { lens = Lens.enum.preview } = route.useSearch()
  const navigate = route.useNavigate()
  const { project } = useSuspenseQuery(projectQuery(companyId, projectId)).data
  return (
    <Tabs
      value={lens}
      onValueChange={(next) => {
        const chosen = Lens.safeParse(next)
        if (chosen.success)
          void navigate({ search: (previous) => ({ ...previous, lens: chosen.data }) })
      }}
      className="h-full gap-0"
    >
      <div className="flex items-center justify-between gap-md border-b border-line px-md py-xs">
        <TabsList aria-label="Projeto">
          <TabsTrigger value={Lens.enum.preview}>Prévia</TabsTrigger>
          <TabsTrigger value={Lens.enum.project}>Projeto</TabsTrigger>
        </TabsList>
        {project.address !== null && (
          <a
            href={`https://${project.address}/`}
            className={buttonVariants({ variant: 'primary' })}
          >
            Abrir app
          </a>
        )}
      </div>
      <TabsContent value={Lens.enum.preview} className="min-h-0">
        {props.preview}
      </TabsContent>
      <TabsContent value={Lens.enum.project} className="min-h-0 overflow-y-auto p-xl">
        <Sections />
      </TabsContent>
    </Tabs>
  )
}
