import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { PageTitle } from '../../ui/list.tsx'
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { AREA_FRAME } from './route-states.tsx'
import { AREA_TITLE } from './text.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/**
 * The page of the area **Agentes** (step 24.3.1, U7): its title and the two tabs, each tab its own
 * address, so a tab opens by link and the back button keeps the one the person was on.
 */
export function AreaFrame(props: {
  scope: Scope
  tab: 'agentes' | 'ferramentas'
  children: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className={AREA_FRAME}>
      <PageTitle>{AREA_TITLE}</PageTitle>
      <Tabs
        value={props.tab}
        onValueChange={(next) => {
          if (next === 'agentes') {
            void navigate({
              to: '/companies/$companyId/projects/$projectId/agents',
              params: props.scope,
            })
          } else if (next === 'ferramentas') {
            void navigate({
              to: '/companies/$companyId/projects/$projectId/agents/tools',
              params: props.scope,
            })
          }
        }}
      >
        <TabsList aria-label={AREA_TITLE}>
          <TabsTrigger value="agentes">Agentes</TabsTrigger>
          <TabsTrigger value="ferramentas">Ferramentas</TabsTrigger>
        </TabsList>
      </Tabs>
      {props.children}
    </div>
  )
}
