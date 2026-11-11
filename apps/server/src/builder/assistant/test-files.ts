import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { getMimeType, LocalFilesystem } from '@mastra/core/workspace'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import type { SentFile } from './test-assistant.ts'
import { assisting, created, talking } from './test-assistant.ts'

export { kindOf, sentFilesOf } from './files.ts'

export const PDF_TYPE = 'application/pdf'
const NOTE = '[File uploaded to the sandbox]'
const OBSERVER = /^You are the memory consciousness/
export const READ_FILE = 'mastra_workspace_read_file'
export const COMMAND = 'mastra_workspace_execute_command'
export const PDF = Buffer.concat([
  Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\n'),
  Buffer.alloc(2_000, 'x'),
  Buffer.from('\n%%EOF\n'),
])
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)
/** About 24 thousand tokens of the Assistant's own words, so two of them pass the observer's 30 thousand. */
export const LONG = 'As encomendas da padaria chegam pelo telefone e pelo balcão. '.repeat(1800)

export function file(name: string, type: string, bytes: Buffer): SentFile {
  return {
    filename: name,
    mediaType: type,
    data: `data:${type};base64,${bytes.toString('base64')}`,
  }
}

export const pdf = file('politica.pdf', PDF_TYPE, PDF)
export const png = file('logo.png', 'image/png', PNG)

/** The notes a call carries, each as `path`, `name`, `type`, `size`. */
export function notesOf(call: Sent): Record<string, string>[] {
  return call.texts
    .filter((text) => text.startsWith(NOTE))
    .map((text) =>
      Object.fromEntries(
        text
          .split('\n')
          .slice(1)
          .map((line) => [line.slice(0, line.indexOf(':')), line.slice(line.indexOf(':') + 2)]),
      ),
    )
}

/** The documents a call carries as a part. */
export function documentsIn(call: Sent) {
  return call.media.filter((media) => media.type === 'document')
}

/**
 * An Assistant conversation whose model answers `answer` (the call's index among the Assistant's
 * own), and whose observer answers with the file markers it was given; the calls of each are kept.
 */
export async function conversation(
  t: TestContext,
  answer: (asked: Sent, index: number) => Reply = () => ({ kind: 'text', text: 'Li.' }),
) {
  const calls: Sent[] = []
  const observers: Sent[] = []
  const known = new Set<string>()
  const on = await assisting(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    if (OBSERVER.test(asked.system)) {
      observers.push(asked)
      for (const marker of asked.texts.join('\n').match(/\[File #\d+: [^\]]+\]/g) ?? [])
        known.add(marker)
      const markers = [...known]
      return {
        kind: 'text',
        text: `<observations>\nDate: Nov 11, 2026\n* 🔴 (10:00) A pessoa mandou ${markers.join(' ')}.\n</observations>\n<current-task>Responder.</current-task>\n<suggested-response>Seguir.</suggested-response>`,
      }
    }
    calls.push(asked)
    return answer(asked, calls.length - 1)
  })
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const talk = await talking(t, on.hub, on.ana, url)
  const work = join(on.hub.assistantMachines.folder, 'work')
  return { ...on, ...talk, url, calls, observers, work }
}

/** The machine's own file API as E2B's: its `stat` types a file by its name, which `read_file` reads. */
export class Typed extends LocalFilesystem {
  override async stat(path: string) {
    const found = await super.stat(path)
    return found.type === 'file' ? { ...found, mimeType: getMimeType(path) } : found
  }
}

/** The files the machine holds for the conversation, by their paths under `uploads/`. */
export function placed(work: string): string[] {
  const root = join(work, 'uploads')
  return existsSync(root)
    ? readdirSync(root).flatMap((directory) =>
        readdirSync(join(root, directory)).map((name) => join(directory, name)),
      )
    : []
}
