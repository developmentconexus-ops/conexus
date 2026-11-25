import type { Access, AccessView } from '../../../hub/access/public.ts'
import type { RunScope } from '../../spec/public.ts'
import { principalOf } from '../../spec/public.ts'
import type { appDataTools, builderAppDataTools } from '../app-data/tools.ts'
import type { ConnectorAccess, GrantedConnection } from '../connectors/connector-tools.ts'
import type { Listed } from './listed.ts'
import { inView } from './listed.ts'

/** One of the company's connections as a seat's tools name it: its reads, its skill and its words. */
export type CompanyConnection = ConnectorAccess['connections'][number] &
  Readonly<{ skill: GrantedConnection['skill'] }>

/** How far a seat reads the Projeto's app (C21): not at all, a few rows, or rows and counts; each with its door and the run's ids. */
export type AppDataGrant = Readonly<
  | { kind: 'NONE' }
  | ({ kind: 'READ' } & Omit<Parameters<typeof appDataTools>[0], 'thread'>)
  | ({ kind: 'READ_AND_CHECK' } & Omit<Parameters<typeof builderAppDataTools>[0], 'thread'>)
>

/** What the company's tools of one run answer by: the run, its view and what the consumer grants. */
export type CompanyToolScope<C extends CompanyConnection = CompanyConnection> = Readonly<{
  run: RunScope
  /** What the door lists for the run's principal: every tool names only this. */
  view: AccessView
  /** The same principal on every connection the place offers: only the overview reads it. */
  reach: AccessView
  grants: Readonly<{ noteSave: boolean; appData: AppDataGrant }>
  /** What the place gives the run, read once when a tool, a skill or a prompt first asks. */
  received: () => Promise<readonly C[]>
  /** The received connections in the run's view. */
  connections: () => Promise<Listed<C>>
}>

/**
 * The scope of the run's company tools (Factory `factory.ts:1980-1994`, `resolveFactoryToolScope`):
 * the view once, and the reach once more only for an Assistant's conversation that chose its
 * connections, the one seat whose overview lists what it did not choose.
 */
export async function companyToolScope<C extends CompanyConnection>(
  run: RunScope,
  deps: Readonly<{
    access: Pick<Access, 'viewOf'>
    connections: (run: RunScope) => Promise<readonly C[]>
  }>,
  grants: CompanyToolScope['grants'],
): Promise<CompanyToolScope<C>> {
  const viewing = deps.access.viewOf(principalOf(run))
  const reaching =
    run.kind === 'assistant' && run.choice.kind === 'CHOSEN'
      ? deps.access.viewOf(principalOf({ ...run, choice: { kind: 'ANY' } }))
      : viewing
  const [view, reach] = await Promise.all([viewing, reaching])
  let received: Promise<readonly C[]> | undefined
  function receivedOnce() {
    received ??= deps.connections(run)
    return received
  }
  return {
    ...{ run, view, reach, grants },
    received: receivedOnce,
    connections: async () => inView(view, await receivedOnce()),
  }
}
