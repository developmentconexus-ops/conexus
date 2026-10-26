import { useState } from 'react'

/** A file the person sends, as Mastra's route takes it (`@mastra/client-js@1.56.0` `agent-controller.d.ts:196-203`). */
export type MessageFile = { data: DataUrl; mediaType: string; filename: string }
/** A whole `readAsDataURL` result: Mastra reads a text file's words only behind its `data:` prefix. */
export type DataUrl = string & { readonly __brand: 'DataUrl' }
export type Outgoing = { content: string; files: readonly MessageFile[] }

/** The route's ceilings on `files` (`@mastra/server@1.79.0` `agent-controller.js:169-187`), which it does not export. */
export const LIMITS = { files: 20, data: 14_680_064, total: 29_360_128 } as const
export const ACCEPT =
  'application/pdf,text/markdown,.md,text/plain,.txt,image/png,image/jpeg,image/gif,image/webp'

export type Refusal = 'too-many' | 'too-large' | 'too-large-together' | 'type'

const TYPES = new Set(ACCEPT.split(',').filter((each) => !each.startsWith('.')))
/** Browsers can leave a text file's type empty (Mastra playground `attachment-kind.ts`). */
const BY_EXTENSION: Record<string, string> = { md: 'text/markdown', txt: 'text/plain' }

function mediaTypeOf(file: File): string {
  if (file.type !== '') return file.type
  return BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? ''
}

function isDataUrl(read: unknown): read is DataUrl {
  return typeof read === 'string' && read.startsWith('data:')
}

function dataUrlOf(file: File, mediaType: string): Promise<DataUrl> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      isDataUrl(reader.result)
        ? resolve(reader.result)
        : reject(new Error(`${file.name} was not read as a data URL`))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(new Blob([file], { type: mediaType }))
  })
}

/**
 * The files of the draft: picked, pasted or dropped, read whole as data URLs, and held to the
 * route's ceilings, measured on the data URL as the route measures it. What passes joins the draft;
 * what does not is left out and said (AI Elements `prompt-input`).
 */
export function useAttachments(draft: {
  files: readonly MessageFile[]
  setFiles: (files: readonly MessageFile[]) => void
}) {
  const [refusal, setRefusal] = useState<Refusal | null>(null)

  async function add(picked: FileList | readonly File[]) {
    const typed = Array.from(picked, (file) => ({ file, mediaType: mediaTypeOf(file) }))
    const accepted = typed.filter((each) => TYPES.has(each.mediaType))
    let refused: Refusal | null = accepted.length < typed.length ? 'type' : null
    const files = [...draft.files]
    let total = files.reduce((sum, each) => sum + each.data.length, 0)
    for (const { file, mediaType } of accepted) {
      if (files.length === LIMITS.files) {
        refused = 'too-many'
        continue
      }
      const data = await dataUrlOf(file, mediaType)
      if (data.length > LIMITS.data) refused = 'too-large'
      else if (total + data.length > LIMITS.total) refused = 'too-large-together'
      else {
        files.push({ data, mediaType, filename: file.name })
        total += data.length
      }
    }
    draft.setFiles(files)
    setRefusal(refused)
  }

  return {
    files: draft.files,
    add,
    remove: (index: number) => {
      draft.setFiles(draft.files.filter((_, at) => at !== index))
      setRefusal(null)
    },
    refusal,
  }
}
