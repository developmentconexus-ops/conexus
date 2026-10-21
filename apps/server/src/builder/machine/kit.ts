import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { SandboxStartHook, WorkspaceSandbox } from '@mastra/core/workspace'
import { z } from 'zod'
import type { Transport } from './filesystem.ts'

/** A machine's id at the provider, made only by parsing (code C23). */
export const SandboxId = z.string().min(1).brand('SandboxId')
export type SandboxId = z.infer<typeof SandboxId>

/** The machine's app folder, which the template makes, the file tools root in and the Builder is told of. */
export const APP_FOLDER = '/home/user/app'

/** The metadata keys every machine of this installation carries, written at its start and read by the sweep (security S36). */
export const MARK = {
  origin: 'conexus_origin',
  company: 'conexus_company',
  project: 'conexus_project',
} as const

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
  /** The machine to wake; the provider refuses to make another if it is gone (decision 0051). */
  sandboxId: SandboxId | undefined
  deadline: Date
  metadata: Record<string, string>
  onStart: SandboxStartHook
}

export type KitFactory = (options: KitOptions) => Kit

/** The machines of this installation the provider holds, found by the mark they carry. */
export type MachineApi = {
  /** Whether the provider still holds the machine, running or paused. */
  exists(id: SandboxId): Promise<boolean>
  list(): Promise<{ id: SandboxId; companyId: CompanyId; projectId: ProjectId }[]>
  kill(id: SandboxId): Promise<void>
}
