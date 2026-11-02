import type { AgentId, CompanyId } from '@conexus/hub-api'

/** What changes an agent's live version: publishing and going back, or deleting, after the transaction commits; and the start of a deletion. */
export type AgentEvent =
  | { kind: 'ACTIVATED'; companyId: CompanyId; agentId: AgentId; version: number }
  | { kind: 'DELETED'; companyId: CompanyId; agentId: AgentId }
  /** Before the row goes, the person admitted: its conversations leave first (data D22). */
  | { kind: 'DELETING'; companyId: CompanyId; agentId: AgentId }

type Hook = (event: AgentEvent) => Promise<void>

/**
 * The hooks that follow an agent's live version (step 24.3: the registry of U2, the automations of
 * U6), called in the order they joined, after the change committed.
 */
export function agentEvents() {
  const hooks: Hook[] = []
  return {
    onChange: (hook: Hook) => {
      hooks.push(hook)
    },
    async emit(event: AgentEvent): Promise<void> {
      for (const hook of hooks) await hook(event)
    },
  }
}
