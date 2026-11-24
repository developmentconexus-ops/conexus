import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { cn } from '../../ui/cn.ts'
import { START_COLUMN } from '../conversation/public.ts'
import { AgentList } from './agent-list.tsx'
import { AreaFrame } from './area-frame.tsx'
import { MEMBERS_CANNOT } from './text.ts'

const company = getRouteApi('/_app/companies/$companyId')
type Scope = { companyId: CompanyId; projectId: ProjectId }

/**
 * **Agentes** of a Projeto (step 24.3, U5, criterion 26, the founder's 2A and the prototype's one
 * column): the box that begins a conversation with the Construtor, the Projeto's agents with what
 * each does, its tools and its state, and the earlier conversations. The Construtor's two blocks are
 * its own, handed in by the route. The Hub refuses a read to whoever may not manage agents, so the
 * route does not open for them (S10); the sentence below is for a role that changed.
 */
export function AgentsArea(props: Scope & { ask: ReactNode; earlier: ReactNode }) {
  const { may } = company.useRouteContext()
  const scope = { companyId: props.companyId, projectId: props.projectId }
  if (!may.manageAgents) return <p className="p-xl text-text-2">{MEMBERS_CANNOT}</p>
  return (
    <AreaFrame scope={scope} tab="agentes">
      <div className={cn(START_COLUMN, 'gap-lg')}>
        {props.ask}
        <AgentList companyId={scope.companyId} projectId={scope.projectId} />
        {props.earlier}
      </div>
    </AreaFrame>
  )
}
