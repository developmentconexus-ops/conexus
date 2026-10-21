import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { SandboxStartHook, WorkspaceSandbox } from '@mastra/core/workspace'
import { z } from 'zod'
import type { Transport } from './filesystem.ts'

/** A machine's id at the provider, made only by parsing (code C23). */
export const SandboxId = z.string().min(1).brand('SandboxId')
export type SandboxId = z.infer<typeof SandboxId>

/** The hosts a machine may reach: `npm install` needs the registry and nothing else (decision 0051). */
export const ALLOWED_HOSTS = ['registry.npmjs.org']

/** What the machine's provider gives the Builder: a Mastra sandbox, how bytes cross, and the network. */
export type Kit = {
  sandbox: WorkspaceSandbox
  transport: Transport
  /** The provider's id for this machine once it is up, to wake it by next time. */
  sandboxId(): SandboxId | undefined
  /** Narrows a running machine to the allowed hosts again. */
  closeNetwork(): Promise<void>
}

type KitOptions = {
  /** `conexus-<projectId>`: the provider finds a machine of this Projeto by it. */
  id: string
  sandboxId: SandboxId | undefined
  deadline: Date
  metadata: Record<string, string>
  onStart: SandboxStartHook
}

export type KitFactory = (options: KitOptions) => Kit

/** The machines of this installation the provider holds, found by the mark they carry. */
export type MachineApi = {
  list(): Promise<{ id: SandboxId; companyId: CompanyId; projectId: ProjectId }[]>
  kill(id: SandboxId): Promise<void>
}
