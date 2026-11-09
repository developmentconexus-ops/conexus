import type { AgentId, CompanyId, OfProject } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import type { Mastra } from '@mastra/core/mastra'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Activation } from './activation.ts'
import type { AgentRun } from './agent.ts'
import { agentKey } from './agent.ts'
import type { FrozenVersion } from './frozen.ts'

type Live = FrozenVersion & OfProject & { agentId: AgentId }

/** How the registry reads the versions an agent runs (`frozen.ts`, over the Hub's database). */
export type AgentReads = {
  activeOf: (ids: OfProject, agentId: AgentId) => Promise<FrozenVersion | null>
  draftOf: (ids: OfProject, agentId: AgentId) => Promise<FrozenVersion>
  versionOf: (
    ids: OfProject,
    agentId: AgentId,
    version: Activation,
  ) => Promise<FrozenVersion | null>
  liveOf: (companyId: CompanyId, agentId: AgentId) => Promise<Live | null>
  publishedAll: () => Promise<Live[]>
}

/** The agent a turn runs, and the activation it runs: none for the draft. */
type Resolution = { agent: Agent; activation: Activation | undefined }

export type Registry = {
  /** Before `startWorkers`; never throws for one agent alone. */
  hydrate(): Promise<{ count: number }>
  /** Reads the active version again and swaps the registered agent; in a line per agent. */
  replace(agentId: AgentId, companyId: CompanyId): Promise<void>
  /** In the agent's line, behind a swap or a registration still under way. */
  remove(agentId: AgentId): Promise<void>
  /**
   * The registered agent (registered if missing: `lazy`), or the draft's, made for the turn. A turn
   * that began on another activation, which its snapshot brings back after a card, gets that
   * version made again from its row (`pinned`); a new turn gets the registered one.
   */
  resolve(run: AgentRun, pinned?: Activation): Promise<Resolution>
}

/** Work on one agent waits for the work before it on the same agent, whichever way that ended (C63). */
function lineUp() {
  const lines = new Map<AgentId, Promise<unknown>>()
  return <T>(agentId: AgentId, work: () => Promise<T>): Promise<T> => {
    const done = (lines.get(agentId) ?? Promise.resolve()).then(work, work)
    const settled = done.then(
      () => undefined,
      () => undefined,
    )
    lines.set(agentId, settled)
    void settled.then(() => {
      if (lines.get(agentId) === settled) lines.delete(agentId)
    })
    return done
  }
}

/**
 * Every published agent as one `new Agent` on the Hub's `Mastra`, under its id (step 24.3, U2), as
 * Mastra's editor registers a stored agent (`packages/editor/src/namespaces/agent.ts:1169-1199`,
 * `:438-446`): `removeAgent` before `addAgent`, since `addAgent` ignores a key it already holds. It
 * looks an agent up only by `listAgents()`, never by `getAgent`, whose error lists every company's
 * keys (security S40). A swap and a lazy registration of the same agent wait in one line (C63).
 */
export function createRegistry(
  deps: AgentReads & { mastra: () => Mastra; build: (live: Live) => Agent; log: FailureLog },
): Registry {
  const inLine = lineUp()
  const activations = new WeakMap<Agent, Activation>()

  function found(agentId: AgentId): Agent | undefined {
    const agents: Record<string, Agent | undefined> = deps.mastra().listAgents()
    return agents[agentKey(agentId)]
  }

  function register(live: Live, lazy: boolean): Agent {
    const key = agentKey(live.agentId)
    const agent = deps.build(live)
    const activation = activationOf(live.source)
    if (activation !== undefined) activations.set(agent, activation)
    deps.mastra().removeAgent(key)
    deps.mastra().addAgent(agent, key, { source: 'stored' })
    const version = live.source.kind === 'VERSION' ? live.source.number : 0
    deps.log.info(
      { companyId: live.companyId, agentId: live.agentId, version, lazy },
      'AGENT_REGISTERED',
    )
    return agent
  }

  function failed(about: { companyId: CompanyId; agentId: AgentId }, error: unknown): void {
    const failure =
      error instanceof Failure ? error : new Failure('INTERNAL_UNEXPECTED', { cause: error })
    const { companyId, agentId } = about
    logFailure(deps.log, failure, { companyId, agentId }, 'AGENT_REGISTER_FAILED')
  }

  return {
    async hydrate() {
      const startedAt = performance.now()
      let count = 0
      for (const live of await deps.publishedAll()) {
        try {
          register(live, false)
          count += 1
        } catch (error) {
          failed(live, error)
        }
      }
      const ms = Math.round(performance.now() - startedAt)
      deps.log.info({ count, ms }, 'AGENTS_HYDRATED')
      return { count }
    },

    // A swap that fails after the version was saved leaves no agent registered: the next turn
    // that asks for it registers it from the row (`lazy`).
    replace: (agentId, companyId) =>
      inLine(agentId, async () => {
        deps.mastra().removeAgent(agentKey(agentId))
        try {
          const live = await deps.liveOf(companyId, agentId)
          if (live !== null) register(live, false)
        } catch (error) {
          failed({ companyId, agentId }, error)
        }
      }),

    remove: (agentId) =>
      inLine(agentId, async () => {
        deps.mastra().removeAgent(agentKey(agentId))
      }),

    async resolve(run, pinned) {
      if (run.kind === 'DRAFT') {
        const draft = await deps.draftOf(run.scope, run.agentId)
        const agent = deps.build({ ...draft, ...run.scope, agentId: run.agentId })
        return { agent, activation: undefined }
      }
      const agent =
        found(run.agentId) ??
        (await inLine(run.agentId, async () => {
          const again = found(run.agentId)
          if (again !== undefined) return again
          const active = await deps.activeOf(run.scope, run.agentId)
          if (active === null) throw new Failure('AGENT_NOT_PUBLISHED')
          return register({ ...active, ...run.scope, agentId: run.agentId }, true)
        }))
      const activation = activationHeld(activations, agent)
      if (pinned === undefined || sameActivation(pinned, activation)) return { agent, activation }
      return madeAgain(deps, run, pinned)
    },
  }
}

/** The version a turn began on, made again from its row once it is no longer the registered one. */
async function madeAgain(
  deps: Pick<AgentReads, 'versionOf'> & { build: (live: Live) => Agent },
  run: AgentRun,
  pinned: Activation,
): Promise<Resolution> {
  const version = await deps.versionOf(run.scope, run.agentId, pinned)
  if (version === null) throw new Failure('AGENT_VERSION_NOT_FOUND')
  const agent = deps.build({ ...version, ...run.scope, agentId: run.agentId })
  return { agent, activation: pinned }
}

function activationOf(source: FrozenVersion['source']): Activation | undefined {
  return source.kind === 'VERSION'
    ? { number: source.number, answeredBy: source.answeredBy }
    : undefined
}

function activationHeld(activations: WeakMap<Agent, Activation>, agent: Agent): Activation {
  const activation = activations.get(agent)
  if (activation === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'AGENT_WITHOUT_ACTIVATION' } })
  }
  return activation
}

function sameActivation(a: Activation, b: Activation): boolean {
  return a.number === b.number && a.answeredBy === b.answeredBy
}
