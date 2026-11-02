import type { AgentId, CompanyId, OfProject } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import type { Mastra } from '@mastra/core/mastra'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { AgentRun } from './agent.ts'
import { agentKey } from './agent.ts'
import type { FrozenVersion } from './frozen.ts'

type Live = FrozenVersion & OfProject & { agentId: AgentId }

export type Registry = {
  /** Before `startWorkers`; never throws for one agent alone. */
  hydrate(): Promise<{ count: number }>
  /** Reads the active version again and swaps the registered agent; in a line per agent. */
  replace(agentId: AgentId, companyId: CompanyId): Promise<void>
  remove(agentId: AgentId): void
  /** The registered agent (registered if missing: `lazy`), or the draft's, made for the turn. */
  resolve(run: AgentRun): Promise<Agent>
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
export function createRegistry(deps: {
  mastra: () => Mastra
  build: (live: Live) => Agent
  activeOf: (ids: OfProject, agentId: AgentId) => Promise<FrozenVersion | null>
  draftOf: (ids: OfProject, agentId: AgentId) => Promise<FrozenVersion>
  liveOf: (companyId: CompanyId, agentId: AgentId) => Promise<Live | null>
  publishedAll: () => Promise<Live[]>
  log: FailureLog
}): Registry {
  const inLine = lineUp()

  function found(agentId: AgentId): Agent | undefined {
    const agents: Record<string, Agent | undefined> = deps.mastra().listAgents()
    return agents[agentKey(agentId)]
  }

  function register(live: Live, lazy: boolean): Agent {
    const key = agentKey(live.agentId)
    const agent = deps.build(live)
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
    const code = error instanceof Failure ? error.code : 'INTERNAL_UNEXPECTED'
    deps.log.error({ ...about, code }, 'AGENT_REGISTER_FAILED')
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

    remove(agentId) {
      deps.mastra().removeAgent(agentKey(agentId))
    },

    async resolve(run) {
      if (run.kind === 'DRAFT') {
        const draft = await deps.draftOf(run.scope, run.agentId)
        return deps.build({ ...draft, ...run.scope, agentId: run.agentId })
      }
      return (
        found(run.agentId) ??
        inLine(run.agentId, async () => {
          const again = found(run.agentId)
          if (again !== undefined) return again
          const active = await deps.activeOf(run.scope, run.agentId)
          if (active === null) throw new Failure('AGENT_NOT_PUBLISHED')
          return register({ ...active, ...run.scope, agentId: run.agentId }, true)
        })
      )
    },
  }
}
