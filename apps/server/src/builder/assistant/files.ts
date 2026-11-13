import { createHash } from 'node:crypto'
import type { MastraDBMessage } from '@mastra/core/memory'
import { parseMemoryRequestContext } from '@mastra/core/memory'
import type {
  FileUploadErrorCode,
  FileUploadTripwireMetadata,
  InputProcessor,
  ProcessInputArgs,
  ProcessInputStepArgs,
  ProcessLLMRequestArgs,
} from '@mastra/core/processors'
import { FILE_UPLOAD_ERROR_CODES, FileUploadProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import type { Memory } from '@mastra/memory'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { emit } from '../model-accounts/public.ts'

/** What the model reads itself and keeps receiving as a part: images. */
const SEEN_BY_MODEL = 'image/'
/** What a placed file weighs in the memory's count: its note, not its bytes (Mastra counts bytes/3 or bytes/4). */
const NOTE_TOKENS = 100
/** The codes of Mastra's stop that are the machine's failure, not the file's or the configuration's. */
const MACHINE_SIDE: readonly FileUploadErrorCode[] = [
  FILE_UPLOAD_ERROR_CODES.NO_SANDBOX,
  FILE_UPLOAD_ERROR_CODES.NO_WRITE_CAPABILITY,
  FILE_UPLOAD_ERROR_CODES.UPLOAD_FAILED,
]
/** The image types `read_file` hands the model as media; a PDF is read on the machine, by its text. */
export const READ_MEDIA = ['image/png', 'image/jpeg', 'image/webp'] as const
/** The attachments the memory's observer still sees: images, as today and as Mastra Code; a PDF leaves its marker. */
export const OBSERVED = ['image/*'] as const

/**
 * Says the failure on the run's controller before it is thrown: Mastra wraps what a processor
 * throws, and the turn takes the code of the first error it hears (`failureOf`), as the accounts'
 * queue does (`emit`).
 */
function told(requestContext: RequestContext | undefined, failure: Failure): Failure {
  emit({ requestContext }, { type: 'error', error: failure })
  return failure
}

function filter({ mimeType }: { mimeType: string }): boolean {
  return !mimeType.startsWith(SEEN_BY_MODEL)
}

type Prompt = ReadonlyArray<{ role: string; content: unknown }>

const PromptFile = z.object({
  type: z.literal('file'),
  mediaType: z.string(),
  data: z.union([z.instanceof(Uint8Array), z.string()]),
})

/** Mastra's rule for what it uploads (`isInlineData`), for what the composer sends: bytes or a data URL; a link is left to the model. */
function isInline(data: Uint8Array | string): boolean {
  return typeof data !== 'string' || data.startsWith('data:') || !data.includes(':')
}

/** Whether a user message of the prompt carries a file the machine takes. */
function hasPlacedFile(prompt: Prompt): boolean {
  return prompt.some(
    (message) =>
      message.role === 'user' &&
      Array.isArray(message.content) &&
      message.content.some((part) => {
        const file = PromptFile.safeParse(part)
        return file.success && isInline(file.data.data) && filter({ mimeType: file.data.mediaType })
      }),
  )
}

const StoredFile = z.object({
  type: z.literal('file'),
  data: z.string(),
  mimeType: z.string(),
  filename: z.string().optional(),
})

type StoredPart = { type: string; providerMetadata?: Record<string, unknown> }
type Stored = { role: string; content: { parts?: StoredPart[] } }

/** Stamps the note's weight on the person's file parts that are not images and carry no client estimate yet; the person's message arrives as a signal. */
function stamped(messages: readonly Stored[]): void {
  for (const message of messages) {
    if (message.role === 'assistant') continue
    for (const part of message.content.parts ?? []) {
      const file = StoredFile.safeParse(part)
      if (!file.success || !filter({ mimeType: file.data.mimeType })) continue
      const mastra = z
        .object({ tokenEstimate: z.object({ source: z.literal('client') }).loose() })
        .safeParse(part.providerMetadata?.mastra)
      if (mastra.success) continue
      part.providerMetadata = {
        ...part.providerMetadata,
        mastra: { tokenEstimate: { v: 0, source: 'client', key: 'client', tokens: NOTE_TOKENS } },
      }
    }
  }
}

/** The request context's mark that the conversation's machine was made new: the files it held are gone. */
const RECYCLED = 'conexus-machine-recycled'

/** Where a file was placed on the machine, kept on the person's file part so a later turn needs no call to confirm it. */
const Placed = z.object({
  hash: z.string(),
  size: z.number(),
  relativePath: z.string(),
  path: z.string(),
})
type Placed = z.infer<typeof Placed>

const PlacedPart = z.object({
  type: z.literal('file'),
  providerMetadata: z.object({ conexus: z.object({ placed: Placed }) }).loose(),
})

/** Mastra's `UploadCache` (`file-upload.ts` `cacheOf`): internal, so a test breaks it if a version changes its shape. */
const Cache = z.object({
  paths: z.instanceof(Map<string, string>),
  digests: z.instanceof(Map<string | Uint8Array, { hash: string; size: number }>),
})

/** A part's provider metadata with the place of its file set, or, with none, taken off; the rest stays. */
function withPlaced(metadata: unknown, placed: Placed | undefined): Record<string, unknown> {
  const { conexus, ...rest } = z.record(z.string(), z.unknown()).catch({}).parse(metadata)
  const { placed: _gone, ...others } = z.record(z.string(), z.unknown()).catch({}).parse(conexus)
  const next = placed === undefined ? others : { ...others, placed }
  return { ...rest, ...(Object.keys(next).length === 0 ? {} : { conexus: next }) }
}

function bytesOf(data: Uint8Array | string): Buffer {
  return typeof data === 'string'
    ? Buffer.from(data.replace(DATA_URL, ''), 'base64')
    : Buffer.from(data)
}

function hashOf(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

/** The place of each file the history's parts say was placed, by content hash. */
function placedIn(messageList: ProcessLLMRequestArgs['messageList']): Map<string, Placed> {
  const found = new Map<string, Placed>()
  for (const message of messageList?.get.all.db() ?? []) {
    for (const part of message.content.parts ?? []) {
      const placed = PlacedPart.safeParse(part)
      if (placed.success) {
        const record = placed.data.providerMetadata.conexus.placed
        found.set(record.hash, record)
      }
    }
  }
  return found
}

/**
 * Fills the native's cache with the files of earlier turns, so it writes their notes and calls no
 * machine for them; returns the cache it made, or nothing when no file of the history was placed.
 */
function seeded(args: ProcessLLMRequestArgs<FileUploadTripwireMetadata>): z.infer<typeof Cache> | undefined {
  const known = placedIn(args.messageList)
  if (known.size === 0) return undefined
  const cache = {
    paths: new Map<string, string>(),
    digests: new Map<string | Uint8Array, { hash: string; size: number }>(),
  }
  for (const message of args.prompt) {
    if (message.role !== 'user' || !Array.isArray(message.content)) continue
    for (const part of message.content) {
      const file = PromptFile.safeParse(part)
      if (!file.success || !isInline(file.data.data) || !filter({ mimeType: file.data.mediaType }))
        continue
      const record = known.get(hashOf(bytesOf(file.data.data)))
      if (record === undefined) continue
      cache.digests.set(file.data.data, { hash: record.hash, size: record.size })
      cache.paths.set(record.relativePath, record.path)
    }
  }
  args.state.uploads = cache
  return cache
}

/** Takes off the native's cache what `seeded` put there, keeping what the native wrote itself. */
function unseeded(args: ProcessLLMRequestArgs<FileUploadTripwireMetadata>, seed: z.infer<typeof Cache>): void {
  const cache = Cache.safeParse(args.state.uploads)
  if (!cache.success) return
  for (const key of seed.paths.keys()) cache.data.paths.delete(key)
  for (const key of seed.digests.keys()) cache.data.digests.delete(key)
}

/**
 * Writes where the native placed each file of the person on its part. The memory saves the new
 * message with it; a message of the history, which the native placed again after a new machine, is
 * saved here.
 */
async function recorded(
  args: ProcessLLMRequestArgs<FileUploadTripwireMetadata>,
  memory: Memory,
  recycled: boolean,
): Promise<void> {
  const cache = Cache.safeParse(args.state.uploads)
  if (!cache.success) return
  const fresh = new Set((args.messageList?.get.input.db() ?? []).map((message) => message.id))
  const changed: MastraDBMessage[] = []
  for (const message of args.messageList?.get.all.db() ?? []) {
    if (message.role === 'assistant') continue
    let touched = false
    for (const part of message.content.parts ?? []) {
      const file = StoredFile.safeParse(part)
      if (!file.success || !filter({ mimeType: file.data.mimeType })) continue
      const known = PlacedPart.safeParse(part)
      if (known.success && !recycled) continue
      const bytes = bytesOf(file.data.data)
      const hash = hashOf(bytes)
      const place = [...cache.data.paths].find(([relativePath]) => relativePath.includes(hash))
      if (place === undefined) continue
      // After a new machine the stored copy lost its record in `forgetPlaced`; this copy still has it.
      Object.assign(part, {
        providerMetadata: withPlaced(part.providerMetadata, {
          hash,
          size: bytes.length,
          relativePath: place[0],
          path: place[1],
        }),
      })
      touched = true
    }
    if (touched && !fresh.has(message.id)) changed.push(message)
  }
  if (changed.length > 0) await memory.saveMessages({ messages: changed })
}

/**
 * The conversation's machine was made new, so the files it held are gone: tells the run, and takes
 * the place off every stored file part so the next turn lets the native write them again.
 */
export async function forgetPlaced(memory: Memory, requestContext: RequestContext): Promise<void> {
  requestContext.set(RECYCLED, true)
  const context = parseMemoryRequestContext(requestContext)
  const threadId = context?.thread?.id
  if (threadId === undefined) return
  const { messages } = await memory.recall({
    threadId,
    ...(context?.resourceId === undefined ? {} : { resourceId: context.resourceId }),
    perPage: false,
  })
  const held = messages.filter((message) =>
    message.content.parts?.some((part) => PlacedPart.safeParse(part).success),
  )
  for (const message of held) {
    for (const part of message.content.parts ?? []) {
      if (!PlacedPart.safeParse(part).success) continue
      Object.assign(part, { providerMetadata: withPlaced(part.providerMetadata, undefined) })
    }
  }
  if (held.length > 0) await memory.saveMessages({ messages: held })
}

/**
 * Mastra's `FileUploadProcessor`, built for each model call with that step's machine
 * (`ProcessLLMRequestArgs.workspace`), since the Hub picks the machine per request; a call without a
 * machine with a sandbox changes nothing. Turns the native stop on a file of this turn it could not
 * write into the machine's failure, so the screen says MACHINE_UNAVAILABLE; a file of the history
 * the machine cannot take is the native note, and the turn goes on.
 * Stamps the note's estimate on the new file parts that are not images (`processInput`,
 * `processInputStep`; criterion 10).
 */
export function machineUploads(deps: {
  log: FailureLog
  memory: Memory
}): InputProcessor<FileUploadTripwireMetadata> {
  return {
    id: 'file-upload',
    name: 'File Upload',
    async processInput(args: ProcessInputArgs) {
      stamped(args.messages)
      return args.messages
    },
    async processInputStep(args: ProcessInputStepArgs) {
      stamped(args.messageList.get.input.db())
    },
    async processLLMRequest(args: ProcessLLMRequestArgs<FileUploadTripwireMetadata>) {
      const machine = args.workspace
      if (machine?.hasSandboxConfig() !== true || !hasPlacedFile(args.prompt)) return undefined
      // The route already caps every file; the native check stays, with no second copy of that cap.
      const native = new FileUploadProcessor({
        workspace: machine,
        filter,
        maxFileSize: () => Number.POSITIVE_INFINITY,
      })
      // A file of this turn the machine could not take stops the turn as the machine's failure.
      // A stop the person asked for stays the native stop: the write failed because the turn ended.
      const abort: typeof args.abort = (reason, options) => {
        const code = MACHINE_SIDE.find((each) => each === options?.metadata?.code)
        if (!args.abortSignal?.aborted && code !== undefined) {
          deps.log.error({ reason: 'UPLOAD', code }, 'MACHINE_UNAVAILABLE')
          throw told(args.requestContext, new Failure('MACHINE_UNAVAILABLE'))
        }
        return args.abort(reason, options)
      }
      // A file placed in an earlier turn is a note again with no call to the machine: its place is
      // seeded in Mastra's cache of the request, which the native reads before it asks for the machine.
      // A machine made new since (`recycled`) holds none of them: the cache starts empty and the
      // native places them again.
      const { requestContext, state } = args
      const recycled = requestContext?.get(RECYCLED) === true
      if (recycled) delete state.uploads
      const seed = recycled ? undefined : seeded(args)
      let result = await native.processLLMRequest({ ...args, abort })
      // The machine was made new while the native wrote a file of this turn (`boot` marked it): the
      // seeded files of the history are not on it. They leave the cache and the native writes them.
      const renewed = !recycled && requestContext?.get(RECYCLED) === true
      if (renewed && seed !== undefined) {
        unseeded(args, seed)
        result = await native.processLLMRequest({ ...args, abort })
      }
      requestContext?.delete(RECYCLED)
      await recorded(args, deps.memory, recycled || renewed)
      return result
    },
  }
}

/** A file the person sent, as the stored message keeps it. */
export type SentFile = { name: string; mediaType: string; bytes: number }

const DATA_URL = /^data:[^,]*;base64,/

/** The files of the person's messages, in order, once each (by content), from Mastra's stored parts. */
export function sentFilesOf(
  messages: readonly { role: string; content: { parts?: unknown[] } }[],
): SentFile[] {
  const seen = new Set<string>()
  const files: SentFile[] = []
  for (const message of messages) {
    if (message.role === 'assistant') continue
    for (const part of message.content.parts ?? []) {
      const file = StoredFile.safeParse(part)
      if (!file.success || seen.has(file.data.data)) continue
      seen.add(file.data.data)
      files.push({
        name: file.data.filename ?? 'arquivo',
        mediaType: file.data.mimeType,
        bytes: Buffer.byteLength(file.data.data.replace(DATA_URL, ''), 'base64'),
      })
    }
  }
  return files
}

const KINDS: readonly { word: string; types: readonly string[]; extensions: readonly string[] }[] =
  [
    { word: 'PDF', types: ['application/pdf'], extensions: ['pdf'] },
    {
      word: 'planilha',
      types: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      extensions: ['xlsx', 'csv'],
    },
    {
      word: 'documento',
      types: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      extensions: ['docx'],
    },
    { word: 'texto', types: [], extensions: ['txt', 'md'] },
  ]

/** The word the person reads for a file's kind, never the MIME type; the extension decides when the type is the catch-all one. */
export function kindOf(file: SentFile): string {
  if (file.mediaType.startsWith('image/')) return 'imagem'
  const extension = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
  const kind = KINDS.find(
    (each) => each.types.includes(file.mediaType) || each.extensions.includes(extension),
  )
  return kind?.word ?? 'arquivo'
}
