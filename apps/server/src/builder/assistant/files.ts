import type {
  InputProcessor,
  ProcessInputArgs,
  ProcessInputStepArgs,
} from '@mastra/core/processors'
import { FileUploadProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'

/** What the model reads itself and keeps receiving as a part: images. */
const SEEN_BY_MODEL = 'image/'
/** What a placed file weighs in the memory's count: its note, not its bytes (Mastra counts bytes/3 or bytes/4). */
const NOTE_TOKENS = 100
/** The codes of Mastra's stop that are the machine's failure, not the file's or the configuration's. */
const MACHINE_SIDE: ReadonlySet<unknown> = new Set([
  'NO_SANDBOX',
  'NO_WRITE_CAPABILITY',
  'UPLOAD_FAILED',
])
/** The image types `read_file` hands the model as media; a PDF is read on the machine, by its text. */
export const READ_MEDIA = ['image/png', 'image/jpeg', 'image/webp'] as const
/** The attachments the memory's observer still sees: images, as today and as Mastra Code; a PDF leaves its marker. */
export const OBSERVED = ['image/*'] as const

const Controller = z.object({
  emitEvent: z.custom<(event: { type: 'error'; error: Failure }) => void>(
    (value) => typeof value === 'function',
  ),
})

/**
 * Says the failure on the run's controller before it is thrown: Mastra wraps what a processor
 * throws, and the turn takes the code of the first error it hears (`failureOf`), as the accounts'
 * queue does (`processors.ts`).
 */
function told(requestContext: RequestContext | undefined, failure: Failure): Failure {
  const controller = Controller.safeParse(requestContext?.get('controller'))
  if (controller.success) controller.data.emitEvent({ type: 'error', error: failure })
  return failure
}

function filter({ mimeType }: { mimeType: string }): boolean {
  return !mimeType.startsWith(SEEN_BY_MODEL)
}

type Prompt = ReadonlyArray<{ role: string; content: unknown }>

const PromptFile = z.object({ type: z.literal('file'), mediaType: z.string() })

/** Whether a user message of the prompt carries a file the machine takes. */
function hasPlacedFile(prompt: Prompt): boolean {
  return prompt.some(
    (message) =>
      message.role === 'user' &&
      Array.isArray(message.content) &&
      message.content.some((part) => {
        const file = PromptFile.safeParse(part)
        return file.success && filter({ mimeType: file.data.mediaType })
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

/**
 * Mastra's `FileUploadProcessor`, built for each model call with that step's machine
 * (`ProcessLLMRequestArgs.workspace`), since the Hub picks the machine per request; a call without a
 * machine with a sandbox changes nothing. Starts the machine first, and turns the native stop on a
 * file it could not write into the machine's failure, so the screen says MACHINE_UNAVAILABLE.
 * Stamps the note's estimate on the new file parts that are not images (`processInput`,
 * `processInputStep`; criterion 10).
 */
export function machineUploads(deps: { log: FailureLog }): InputProcessor {
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
    async processLLMRequest(args) {
      const machine = args.workspace
      if (machine?.hasSandboxConfig() !== true || !hasPlacedFile(args.prompt)) return undefined
      // Started here, so a machine that does not start fails the turn as MACHINE_UNAVAILABLE, not as
      // the native NO_SANDBOX tripwire that the screen reads as MODEL_REFUSED.
      if (args.requestContext !== undefined) {
        try {
          await machine.resolveSandbox({ requestContext: args.requestContext })
        } catch (cause) {
          throw cause instanceof Failure ? told(args.requestContext, cause) : cause
        }
      }
      // The route already caps every file; the native check stays, with no second copy of that cap.
      const native = new FileUploadProcessor({
        workspace: machine,
        filter,
        maxFileSize: () => Number.POSITIVE_INFINITY,
      })
      // A file of this turn the machine could not take stops the turn as the machine's failure.
      // A stop the person asked for stays the native stop: the write failed because the turn ended.
      const abort: typeof args.abort = (reason, options) => {
        const metadata: unknown = options?.metadata
        const code = z.object({ code: z.string() }).safeParse(metadata)
        if (!args.abortSignal?.aborted && code.success && MACHINE_SIDE.has(code.data.code)) {
          deps.log.error({ reason: 'UPLOAD', code: code.data.code }, 'MACHINE_UNAVAILABLE')
          throw told(
            args.requestContext,
            new Failure('MACHINE_UNAVAILABLE', {
              details: { reason: 'UPLOAD', code: code.data.code },
            }),
          )
        }
        return args.abort(reason, options)
      }
      return native.processLLMRequest({ ...args, abort })
    },
  }
}

/** A file the person sent, as the stored message keeps it. */
export type SentFile = { name: string; mediaType: string; bytes: number }

const DATA_URL = /^data:[^,]*;base64,/

/** The decoded size of a stored part's data: a data URL or bare base64. */
function bytesOf(data: string): number {
  const base64 = data.replace(DATA_URL, '')
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

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
        bytes: bytesOf(file.data.data),
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
      types: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ],
      extensions: ['xlsx', 'xls', 'csv'],
    },
    {
      word: 'documento',
      types: [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ],
      extensions: ['docx', 'doc'],
    },
    { word: 'texto', types: ['text/plain', 'text/markdown'], extensions: ['txt', 'md'] },
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
