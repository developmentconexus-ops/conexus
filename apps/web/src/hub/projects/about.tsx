import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { Versions } from '../apps/public.ts'
import { About } from './project.tsx'
import { AboutPart } from './search.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId_/about')

/**
 * The Sobre of a Projeto, a page of its own with its parts as tabs: Sobre and Versões, and
 * Publicação when it comes (web W31). Every member reads the Versões and publishes one (step 17,
 * E1). The part lives in the address.
 */
export function AboutPage() {
  const { companyId, projectId } = route.useParams()
  const { part = AboutPart.enum.about } = route.useSearch()
  const navigate = useNavigate()
  return (
    <Tabs
      value={part}
      onValueChange={(next) => {
        const chosen = AboutPart.safeParse(next)
        if (chosen.success) void navigate({ to: '.', search: { part: chosen.data } })
      }}
      className="min-h-0 flex-1 overflow-y-auto p-xl"
    >
      <TabsList aria-label="Partes do Sobre">
        <TabsTrigger value={AboutPart.enum.about}>Sobre</TabsTrigger>
        <TabsTrigger value={AboutPart.enum.versions}>Versões</TabsTrigger>
      </TabsList>
      <TabsContent value={AboutPart.enum.about}>
        <About companyId={companyId} projectId={projectId} />
      </TabsContent>
      <TabsContent value={AboutPart.enum.versions}>
        <Versions companyId={companyId} projectId={projectId} />
      </TabsContent>
    </Tabs>
  )
}
