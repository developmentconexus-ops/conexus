import type { ConversationId } from '@conexus/hub-api'
import type {
  SandboxStartHook,
  WorkspaceFilesystem,
  WorkspaceSandbox,
} from '@mastra/core/workspace'
import { MAX_BYTES } from '../git/public.ts'

/** The machine's app folder, which the template makes, the file tools root in and the Builder is told of. */
export const APP_FOLDER = '/home/user/app'

/** The metadata keys every machine of this installation carries, written at its start and read by its kill (security S36). */
export const MARK = {
  origin: 'conexus_origin',
  company: 'conexus_company',
  project: 'conexus_project',
  conversation: 'conexus_conversation',
  /** The template the machine was made from: E2B's own record of a machine names no tag. */
  template: 'conexus_template',
} as const

/** The hosts a machine may reach: `npm install` needs the registry and nothing else (decision 0051). */
export const ALLOWED_HOSTS = ['registry.npmjs.org']

/**
 * The most bytes the Hub takes from the machine in one read, by the file tools or as the turn's
 * bundle: a version's cap, for nothing larger can be saved (code C59).
 */
const READ_MAX = MAX_BYTES

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
  /** The provider's own file API, when it has one, is what the file tools use. */
  sandbox: WorkspaceSandbox & { readonly filesystem?: WorkspaceFilesystem }
  transport: Transport
  /** Narrows a running machine to the allowed hosts again. */
  closeNetwork(): Promise<void>
}

type KitOptions = {
  /** `conexus-<installation>-<conversationId>`: the provider finds the conversation's machine by it. */
  id: string
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
 * Conexus but its check (card, U4). `conflicts` are what the machine's start found of work not
 * yet saved meeting a newer saved version, for the Builder to resolve as ordinary work.
 */
export function machineInstructions(workdir: string, conflicts: Conflicts = NO_CONFLICTS): string {
  const lines = [
    `The conversation's own Linux machine, with Node 24, npm and git. Commands start in ${workdir},`,
    `the app folder: work there and nowhere else. Its network reaches only ${ALLOWED_HOSTS.join(', ')}.`,
    'Conexus keeps its check in /opt/conexus, read only: run it with the tool conexus_check, never by hand.',
  ]
  const { markers, deleted, replaced } = conflicts
  if (markers.length + deleted.length + replaced.length > 0)
    lines.push('Work not yet saved met a newer saved version of the app.')
  if (markers.length > 0)
    lines.push(
      `These files hold Git conflict markers; resolve them before any other change: ${listed(markers)}.`,
    )
  if (deleted.length > 0)
    lines.push(
      'These files were deleted in the newer version and changed by the work not yet saved, whose copy',
      `is in the folder: keep or delete each as the app needs: ${listed(deleted)}.`,
    )
  if (replaced.length > 0)
    lines.push(
      'In these files the newer version replaced a change of the work not yet saved that Git could not',
      `merge: redo the change where the app needs it: ${listed(replaced)}.`,
    )
  return lines.join(' ')
}

function listed(paths: readonly string[]): string {
  return paths.map((path) => `\`${path}\``).join(', ')
}

/**
 * What a machine's start found of work not yet saved meeting a newer saved version: the files with
 * conflict markers, read from the tree at every start, and, at the start that merged, the files the
 * newer version deleted and the ones whose change it replaced.
 */
export type Conflicts = {
  markers: readonly string[]
  deleted: readonly string[]
  replaced: readonly string[]
}

export const NO_CONFLICTS: Conflicts = { markers: [], deleted: [], replaced: [] }

export type KitFactory = (options: KitOptions) => Kit

/** Kills every machine of the conversation this installation marked, and says how many; throws when the provider fails. */
export type MachineApi = {
  kill(conversationId: ConversationId): Promise<number>
  /** The same, only the machines whose mark names a template other than `template`, or none. */
  killStale(conversationId: ConversationId, template: string): Promise<number>
}
