import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { SandboxStartHook, WorkspaceSandbox } from '@mastra/core/workspace'
import { z } from 'zod'
import { MAX_BYTES } from '../git/public.ts'

/** A machine's id at the provider, made only by parsing (code C23). */
export const SandboxId = z.string().min(1).brand('SandboxId')
export type SandboxId = z.infer<typeof SandboxId>

/** The machine's app folder, which the template makes, the file tools root in and the Builder is told of. */
export const APP_FOLDER = '/home/user/app'

/** The tag Mastra's E2B sandbox puts on a machine it makes, and checks before it attaches one. */
export const MASTRA_NAME = 'mastra-sandbox-id'

/** The metadata keys every machine of this installation carries, written at its start and read by the sweep (security S36). */
export const MARK = {
  origin: 'conexus_origin',
  company: 'conexus_company',
  project: 'conexus_project',
} as const

/** The hosts a machine may reach: `npm install` needs the registry and nothing else (decision 0051). */
export const ALLOWED_HOSTS = ['registry.npmjs.org']

/**
 * The most bytes the Hub takes from the machine in one read, by the file tools or as the turn's
 * bundle: a version's cap, for nothing larger can be saved (code C59).
 */
export const READ_MAX = MAX_BYTES

/** The most output the Hub keeps of a command it runs in the machine: a `READ_MAX` file as base64, and its reply around it. */
export const OUTPUT_MAX = Math.ceil(READ_MAX / 3) * 4 + 4096

/** How bytes cross to and from the machine for the Hub's own files, by the provider's upload and download. */
export type Transport = {
  write(path: string, bytes: Uint8Array): Promise<void>
  read(path: string): Promise<AsyncIterable<Uint8Array>>
}

/** The file's bytes, or `too-large` once more than `READ_MAX` of them have come. */
export async function readCapped(
  transport: Transport,
  path: string,
): Promise<Buffer | 'too-large'> {
  const chunks: Uint8Array[] = []
  let length = 0
  for await (const chunk of await transport.read(path)) {
    length += chunk.byteLength
    if (length > READ_MAX) return 'too-large'
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

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
  /** `conexus-<installation>-<companyId>-<projectId>`: the provider finds a machine of this Projeto by it. */
  id: string
  /** The machine to wake; the provider refuses to make another if it is gone (decision 0051). */
  sandboxId: SandboxId | undefined
  deadline: Date
  metadata: Record<string, string>
  onStart: SandboxStartHook
  /** Where a command starts when it names no folder: the app folder. */
  workingDirectory: string
  /** What the model is told of the machine, in place of the provider's own words. */
  instructions: string
}

/**
 * The machine as the model is told of it (card of step 14, criterion 32): what the template holds
 * (`infra/e2b/template.ts`), the closed network (decision 0051) and the folder its commands start
 * in. The shell is not held in the folder: the machine is the boundary, and holds nothing of
 * Conexus but its check (card, U4).
 */
export function machineInstructions(workdir: string): string {
  return [
    `The Projeto's own Linux machine, with Node 24, npm and git. Commands start in ${workdir},`,
    `the app folder: work there and nowhere else. Its network reaches only ${ALLOWED_HOSTS.join(', ')}.`,
    'Conexus keeps its check in /opt/conexus, read only: run it with the tool conexus_check, never by hand.',
  ].join(' ')
}

export type KitFactory = (options: KitOptions) => Kit

/** The machines of this installation the provider holds, found by the mark they carry. */
export type MachineApi = {
  /**
   * Whether the provider still holds the machine, running or paused, and Mastra would attach it to
   * `name`: it refuses one tagged with another name, as the machines of before the name carried the
   * installation are.
   */
  holds(id: SandboxId, name: string): Promise<boolean>
  list(): Promise<{ id: SandboxId; companyId: CompanyId; projectId: ProjectId }[]>
  kill(id: SandboxId): Promise<void>
}
