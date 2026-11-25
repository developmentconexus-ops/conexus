import type { CompanyData, ConnectionId, Overview } from '@conexus/hub-api'
import { ASSISTANT_TOOL, CONVERSATION_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import type { Principal } from '../../../hub/access/public.ts'
import { chosenIn } from '../../../hub/access/public.ts'
import type { FailureLog } from '../../../platform/failure.ts'
import { Failure } from '../../../platform/failure.ts'
import type { DataBinding, RunScope } from '../../spec/public.ts'
import { dataContextOf, principalOf } from '../../spec/public.ts'
import { appDataReadAndCheckTools, appDataTools } from '../app-data/tools.ts'
import type { ConnectorAccess, NoteSave } from '../connectors/connector-tools.ts'
import { connectorTools } from '../connectors/connector-tools.ts'
import { dataTools } from '../data/tools.ts'
import type { Listed } from './listed.ts'
import type { CompanyToolName, CompanyToolSeat } from './names.ts'
import { TOOLS_OF } from './names.ts'
import { overviewTool } from './overview.ts'
import type { AppDataGrant, CompanyConnection, CompanyToolScope } from './scope.ts'

/** A call of the connectors' door, bound to the run it is for. */
type OfRun<F extends (...args: never[]) => unknown> = (
  run: RunScope,
  ...args: Parameters<F>
) => ReturnType<F>

/** What the company's tools of every run are made with: the doors of `hub/`, handed over by each consumer. */
export type CompanyToolDeps = Readonly<{
  log: FailureLog
  /** The company's copied data for the run's place and person; a seat without it reads none. */
  data?: (run: RunScope) => CompanyData
  connector: Readonly<{
    read: OfRun<ConnectorAccess['read']>
    notes: OfRun<ConnectorAccess['notes']>
    /** The connections whose notebook the run's speaker may use; a saved agent's tools name no other. */
    notebooks?: (run: RunScope) => Promise<readonly ConnectionId[]>
    saveNote?: OfRun<NoteSave>
  }>
  /** With a machine: the path the turn's next read is saved whole at. */
  savedAt?: (requestContext: RequestContext) => string
  projects?: (run: RunScope) => Promise<Omit<Overview, 'connections'>>
}>

/** A door that answers by the run's principal and its turn: the Assistant's, the Construtor's, the agents'. */
export type PrincipalDoor<T> = Readonly<{
  read: (
    principal: Principal,
    call: Parameters<ConnectorAccess['read']>[0] & { turn: T },
  ) => ReturnType<ConnectorAccess['read']>
  notes: (principal: Principal, connectionId: ConnectionId) => ReturnType<ConnectorAccess['notes']>
  notebooks: (principal: Principal) => Promise<readonly ConnectionId[]>
  saveNote?: (
    principal: Principal,
    call: Parameters<NoteSave>[0] & { turn: T },
  ) => ReturnType<NoteSave>
}>

/** The door's calls as the run's principal, each read and write counted by the run's turn. */
export function byPrincipal<T>(
  door: PrincipalDoor<T>,
  turnOf: (requestContext: RequestContext) => T,
): CompanyToolDeps['connector'] {
  const { saveNote } = door
  return {
    read: (run, call, requestContext) =>
      door.read(principalOf(run), { ...call, turn: turnOf(requestContext) }),
    notes: (run, connectionId) => door.notes(principalOf(run), connectionId),
    notebooks: (run) => door.notebooks(principalOf(run)),
    ...(saveNote === undefined
      ? {}
      : {
          saveNote: (run, call, requestContext) =>
            saveNote(principalOf(run), { ...call, turn: turnOf(requestContext) }),
        }),
  }
}

/** Whose the connections a seat's reads name are, as the tool tells the model. */
const WHOSE: Readonly<Record<CompanyToolSeat, string>> = {
  assistant: 'this conversation chose',
  research: 'this conversation chose',
  builder: "this Project's owner released",
  construtor: 'this Project received',
  agents: 'this agent reads',
}

/**
 * The connections a seat's connector tools name: the run's view; for a saved agent, the ones its
 * version selected (decision E4) whose notebook the role of who runs it may use, since the notebook
 * is no declared operation the view would list.
 */
async function namedBy<C extends CompanyConnection>(
  scope: CompanyToolScope<C>,
  seat: CompanyToolSeat,
  connector: CompanyToolDeps['connector'],
): Promise<readonly C[]> {
  if (seat !== 'agents') return scope.connections()
  if (connector.notebooks === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'AGENT_WITHOUT_NOTEBOOKS' } })
  }
  const [received, usable] = await Promise.all([scope.received(), connector.notebooks(scope.run)])
  return received.filter(
    (each) => chosenIn(scope.run.choice, each.connectionId) && usable.includes(each.connectionId),
  )
}

/** The run's door to its listed connections, each call counted by the run; the tools never decide what may be read. */
export async function connectorAccess<C extends CompanyConnection>(
  scope: CompanyToolScope<C>,
  seat: CompanyToolSeat,
  deps: CompanyToolDeps,
): Promise<ConnectorAccess> {
  const { run } = scope
  return {
    connections: await namedBy(scope, seat, deps.connector),
    savedAt: deps.savedAt,
    log: deps.log,
    read: (call, requestContext) => deps.connector.read(run, call, requestContext),
    notes: (connectionId) => deps.connector.notes(run, connectionId),
    wording: { whose: WHOSE[seat] },
  }
}

/** The notebook's write, for a seat whose consumer grants it and only in a run a person follows. */
function noteSaveOf<C extends CompanyConnection>(
  scope: CompanyToolScope<C>,
  deps: CompanyToolDeps,
): NoteSave | undefined {
  const { saveNote } = deps.connector
  if (!scope.grants.noteSave || !scope.run.attended || saveNote === undefined) return undefined
  return (call, requestContext) => saveNote(scope.run, call, requestContext)
}

async function connectorsOf<C extends CompanyConnection>(
  scope: CompanyToolScope<C>,
  seat: CompanyToolSeat,
  deps: CompanyToolDeps,
  names: readonly CompanyToolName[],
): Promise<ToolsInput> {
  const access = await connectorAccess(scope, seat, deps)
  const save = names.includes(CONVERSATION_TOOL.connectorNoteSave)
    ? noteSaveOf(scope, deps)
    : undefined
  return connectorTools(access, {
    ...(save === undefined ? { noteSave: false } : { noteSave: true, save }),
    ...(names.includes(CONVERSATION_TOOL.connectorRead) ? {} : { reads: false }),
  })
}

function appDataOf(grant: AppDataGrant, thread: DataBinding['thread']): ToolsInput {
  switch (grant.kind) {
    case 'NONE':
      return {}
    case 'READ':
      return appDataTools({ ...grant, thread })
    case 'READ_AND_CHECK':
      return appDataReadAndCheckTools({ ...grant, thread })
    default:
      return grant satisfies never
  }
}

/** The sets as one, as Mastra's `mergeTools` makes them: a name two sets make is refused. */
function merged(sets: readonly ToolsInput[]): ToolsInput {
  const made: ToolsInput = {}
  for (const set of sets) {
    for (const [name, tool] of Object.entries(set)) {
      if (Object.hasOwn(made, name)) throw new Error(`The company tool ${name} is made twice`)
      made[name] = tool
    }
  }
  return made
}

/**
 * The company's tools of one run's seat (Factory `tools/index.ts:33-56`, `createFactoryTools`): by
 * each name `TOOLS_OF` gives the seat, today's piece, bound to the scope by closure and pruned by
 * the grants; a name made twice is refused, as `mergeTools` refuses it.
 */
export async function companyTools<C extends CompanyConnection>(
  scope: CompanyToolScope<C>,
  seat: CompanyToolSeat,
  deps: CompanyToolDeps,
): Promise<ToolsInput> {
  const names: readonly CompanyToolName[] = TOOLS_OF[seat]
  const pieces = merged([
    await connectorsOf(scope, seat, deps, names),
    appDataOf(scope.grants.appData, dataContextOf(scope.run).thread),
    deps.data === undefined ? {} : dataTools({ data: deps.data(scope.run) }),
    deps.projects === undefined
      ? {}
      : { [ASSISTANT_TOOL.overview]: overviewTool(scope, deps.projects) },
  ])
  return Object.fromEntries(
    names.flatMap((name) => {
      const tool = pieces[name]
      return tool === undefined ? [] : [[name, tool]]
    }),
  )
}

/** The connections a seat's skills and prompt name: the run's, in its view. */
export function companyConnections<C extends CompanyConnection>(
  scope: CompanyToolScope<C>,
): Promise<Listed<C>> {
  return scope.connections()
}
