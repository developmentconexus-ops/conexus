import type { AgentId, CompanyData, ProjectId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { DataBinding, RunScope } from '../../harness/spec/public.ts'
import { dataContextOf, principalOf } from '../../harness/spec/public.ts'
import type { Access, Principal } from '../../hub/access/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { AppDataPort } from '../app-data/public.ts'
import type { CompanyConnection, CompanyToolScope, PrincipalDoor } from '../company-tools/public.ts'
import { byPrincipal, companyToolScope, companyTools } from '../company-tools/public.ts'

/**
 * The run's company tools' scope: what the Projeto still offers, in the run's view, and the app's
 * rows when the version reads them and the Projeto has its app.
 */
export async function agentToolScope<C extends CompanyConnection>(
  deps: Readonly<{ access: Pick<Access, 'viewOf'>; appData: AppDataPort }>,
  run: RunScope,
  version: Readonly<{
    offered: readonly C[]
    projectId: ProjectId
    readsApp: boolean
    agentId: AgentId
  }>,
): Promise<CompanyToolScope<C>> {
  const app = { scope: run.owner, projectId: version.projectId }
  const reads = version.readsApp && (await deps.appData.hasApp(app))
  return companyToolScope(
    run,
    { access: deps.access, connections: async () => version.offered },
    {
      noteSave: false,
      appData: reads
        ? { kind: 'READ', appData: deps.appData, ...app, agentId: version.agentId }
        : { kind: 'NONE' },
    },
  )
}

/** The agent's company tools: the notebook, the app's rows and the copied data, every call as the run's principal. */
export function agentTools<T>(
  deps: Readonly<{
    log: FailureLog
    connectors: PrincipalDoor<T>
    companyData: (principal: Principal, context: DataBinding) => CompanyData
  }>,
  turnOf: (requestContext: RequestContext) => T,
  agentId: AgentId,
) {
  const company = {
    ...{ log: deps.log, connector: byPrincipal(deps.connectors, turnOf) },
    data: (run: RunScope) => deps.companyData(principalOf(run), { ...dataContextOf(run), agentId }),
  }
  return <C extends CompanyConnection>(scope: CompanyToolScope<C>) =>
    companyTools(scope, 'agents', company)
}
