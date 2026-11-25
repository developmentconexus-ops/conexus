import type { Overview } from '@conexus/hub-api'
import { ASSISTANT_TOOL } from '@conexus/hub-api'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { RunScope } from '../../harness/spec/public.ts'
import { admitAsker } from '../../harness/spec/public.ts'
import type { AccessView } from '../../hub/access/public.ts'
import { chosenIn } from '../../hub/access/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import type { CompanyProjects } from './ports.ts'

type Listed = Overview['connections'][number]

/**
 * `conexus_overview` (Factory `factory_list_work_items`, `mastracode/factory/src/tools/read-tools.ts:245`,
 * `createFactoryReadTools`, Mastra 1.83): the company's Projetos with their app, and the connections
 * the run reaches in its place, with whether the conversation chose each; the Projetos read again on
 * every call, never a key and never another company.
 */
export function overviewTool(
  scope: Readonly<{ run: RunScope; reach: AccessView }>,
  projects: (run: RunScope) => Promise<Omit<Overview, 'connections'>>,
) {
  return createTool({
    id: ASSISTANT_TOOL.overview,
    description:
      "The company in Conexus now: its Projetos by name, at most 50, with whether its app is published and the version people use, and moreProjects true when it has more; and each connection this conversation's place offers that the person reaches (a table to read or an operation to use), with whether this conversation chose it.",
    inputSchema: z.object({}),
    execute: async () => {
      const listed = await projects(scope.run)
      return { ...listed, connections: reachedIn(scope) } satisfies Overview
    },
  })
}

/**
 * The live Projetos of the company with their app, published or not, a page of them and whether
 * there are more.
 */
export function projectsOf(
  deps: { database: Database; identity: IdentityPorts; projects: CompanyProjects },
  run: RunScope,
): Promise<Omit<Overview, 'connections'>> {
  const { companyId, personId } = run.owner
  return deps.database.read({ kind: 'COMPANY', companyId, personId }, async (tx) => {
    await admitAsker(deps.identity, tx, run.owner)
    const live = await deps.projects.liveProjectsOf(tx, companyId)
    const ids = live.projects.map((each) => each.projectId)
    const published = await deps.projects.publishedVersionsOf(tx, ids)
    const projects = live.projects.map((each) => {
      const version = published.get(each.projectId)
      const app =
        version === undefined
          ? ({ kind: 'NOT_PUBLISHED' } as const)
          : ({ kind: 'PUBLISHED', version: String(version) } as const)
      return { ...each, app }
    })
    return { projects, moreProjects: live.more }
  })
}

function reachedIn(scope: Readonly<{ run: RunScope; reach: AccessView }>): Listed[] {
  const { reach, run } = scope
  return reach.list('system').map(({ connection, connector, name }) => ({
    ...{ connectionId: connection, connector, name },
    chosen: chosenIn(run.choice, connection),
  }))
}
