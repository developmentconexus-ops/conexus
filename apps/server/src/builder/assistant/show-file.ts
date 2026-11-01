import { posix } from 'node:path'
import { ASSISTANT_TOOL, SHOWN_TEXT_MAX, ShowFileInput, ShownFile } from '@conexus/hub-api'
import { createTool } from '@mastra/core/tools'
import { Failure } from '../../platform/failure.ts'
import type { AssistantMachines } from './machine.ts'
import { locate } from './machine.ts'

const TEXT_MEDIA: Record<string, 'text/markdown' | 'text/plain' | 'text/csv'> = {
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
}

const MEDIA: Record<string, string> = {
  ...TEXT_MEDIA,
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.html': 'text/html',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

/** The type a file's name says, for the download and for the screen; `application/octet-stream` when it says none. */
export function mediaOf(name: string): string {
  return MEDIA[posix.extname(name).toLowerCase()] ?? 'application/octet-stream'
}

/** The files the browser may draw in place; every other type is saved. */
export const INLINE_MEDIA = ['image/png', 'image/jpeg', 'image/svg+xml']

function refused(reason: 'OUTSIDE' | 'NOT_FOUND' | 'MACHINE_UNAVAILABLE') {
  return { kind: 'SHOW_REFUSED', reason } as const
}

/**
 * `show_file` (step 24.1, `B-a`): opens beside the chat a file the Assistant wrote in the
 * conversation's folder. A Markdown, text or CSV file of up to 64 KB comes with its content; any
 * other is named, with its size and type, for the person to download. The model gets only
 * `{ shown: path }` or the refusal (`toModelOutput`), never the content; Mastra stores the whole
 * output, which the screen reads back (criterion 19).
 */
export function showFileTool(machines: Pick<AssistantMachines, 'folder' | 'serving'>) {
  return createTool({
    id: ASSISTANT_TOOL.showFile,
    description: `Shows the person a file you wrote in ${machines.folder} beside the chat, to read or download. Show the table, chart or document you made; the person sees nothing of your machine otherwise.`,
    inputSchema: ShowFileInput,
    execute: async ({ path }, { requestContext }): Promise<ShownFile> => {
      const files = requestContext === undefined ? undefined : machines.serving(requestContext)
      if (files === undefined) return refused('MACHINE_UNAVAILABLE')
      try {
        const found = await locate(files, path)
        if (found.kind !== 'FILE') return refused(found.kind)
        const media = TEXT_MEDIA[posix.extname(found.name).toLowerCase()]
        if (media !== undefined && found.bytes <= SHOWN_TEXT_MAX) {
          const content = await files.readFile(found.path, { encoding: 'utf-8' })
          return {
            kind: 'TEXT',
            path: found.path,
            name: found.name,
            media,
            content: String(content),
          }
        }
        return {
          kind: 'FILE',
          path: found.path,
          name: found.name,
          media: mediaOf(found.name),
          bytes: found.bytes,
        }
      } catch (error) {
        if (error instanceof Failure && error.code === 'MACHINE_UNAVAILABLE') {
          return refused('MACHINE_UNAVAILABLE')
        }
        throw error
      }
    },
    toModelOutput: (output) => {
      const shown = ShownFile.safeParse(output)
      if (!shown.success) return undefined
      return {
        type: 'json',
        value: shown.data.kind === 'SHOW_REFUSED' ? shown.data : { shown: shown.data.path },
      }
    },
  })
}
