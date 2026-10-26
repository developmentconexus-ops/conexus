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

type Read = { data: DataUrl; mediaType: string; filename: string }

/**
 * The draft's files with the read ones that pass the route's ceilings, measured on the data URL as
 * the route measures it, and why the others were left out. A file already in the draft is left out
 * without a word.
 */
function admitted(held: readonly MessageFile[], read: readonly Read[], refused: Refusal | null) {
  const files = [...held]
  let total = files.reduce((sum, each) => sum + each.data.length, 0)
  for (const file of read) {
    if (files.some((each) => each.data === file.data)) continue
    if (files.length === LIMITS.files) refused = 'too-many'
    else if (file.data.length > LIMITS.data) refused = 'too-large'
    else if (total + file.data.length > LIMITS.total) refused = 'too-large-together'
    else {
      files.push(file)
      total += file.data.length
    }
  }
  return { files, refused }
}

/**
 * The files of the draft: picked, pasted or dropped, read whole as data URLs, then joined to the
 * draft as it is when the read ends (Factory `useComposerImages.ts`), so what was typed or added
 * meanwhile stays. What does not pass is left out and said (AI Elements `prompt-input`).
 */
export function useAttachments(draft: {
  files: readonly MessageFile[]
  setFiles: (update: (files: readonly MessageFile[]) => readonly MessageFile[]) => void
}) {
  /** Why a file was left out, or `null` when all were taken. */
  async function add(picked: FileList | readonly File[]): Promise<Refusal | null> {
    const typed = Array.from(picked, (file) => ({ file, mediaType: mediaTypeOf(file) }))
    const accepted = typed.filter((each) => TYPES.has(each.mediaType))
    const read = await Promise.all(
      accepted.map(async ({ file, mediaType }) => ({
        data: await dataUrlOf(file, mediaType),
        mediaType,
        filename: file.name,
      })),
    )
    let refused: Refusal | null = accepted.length < typed.length ? 'type' : null
    draft.setFiles((held) => {
      const next = admitted(held, read, refused)
      refused = next.refused
      return next.files
    })
    return refused
  }

  return {
    files: draft.files,
    add,
    remove: (index: number) => draft.setFiles((held) => held.filter((_, at) => at !== index)),
  }
}
