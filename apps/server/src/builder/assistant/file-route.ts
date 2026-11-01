import { posix } from 'node:path'
import type { CompanyId, ConversationId, Person } from '@conexus/hub-api'
import { ASSISTANT_FILE } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { sessionOf } from '../../platform/access.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { untilClientLeaves } from '../../platform/reply-lifetime.ts'
import type { AssistantMachines } from './machine.ts'
import { INLINE_MEDIA, mediaOf } from './show-file.ts'

type FileDeps = {
  machines: AssistantMachines
  log: FailureLog
  /**
   * The person may ask the Assistant now and owns the conversation, else the same `NOT_FOUND` or
   * `CONVERSATION_NOT_FOUND` (security S10).
   */
  ownConversation(
    owner: { companyId: CompanyId; personId: Person['id'] },
    conversationId: ConversationId,
  ): Promise<void>
}

/** What a failed read of the machine's file answers (the codes of `ASSISTANT_FILE`). */
const FILE_FAILURE = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_GONE: 'FILE_GONE',
  MACHINE_UNAVAILABLE: 'MACHINE_UNAVAILABLE',
} as const

/**
 * The name for clients that read only `filename=`: what is not printable ASCII, and the quote and
 * the backslash, become `_`.
 */
function asciiOf(name: string): string {
  return name.replaceAll(/[^\x20-\x7e]|["\\]/g, '_')
}

/**
 * The name as `filename*` takes it (RFC 8187): percent-encoded UTF-8, the characters
 * `encodeURIComponent` leaves but the header does not take, `'` among them, encoded too.
 */
function extendedOf(name: string): string {
  return encodeURIComponent(name).replaceAll(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

/**
 * The Hub's own policy with `sandbox` added: the file may not run, and the policy that keeps the
 * Hub from being framed stays (security S24).
 */
function sandboxed(policy: unknown): string {
  return typeof policy === 'string' && policy !== '' ? `${policy}; sandbox` : 'sandbox'
}

/**
 * The file the Assistant wrote, for the conversation's owner (criterion 20). The model wrote it, so
 * the browser is told not to run it: the type from the name, saved unless an image, `nosniff`, and
 * the
 * Hub's Content-Security-Policy with `sandbox` (security S24). Each file served is logged (code
 * C54).
 */
export function registerFile(app: FastifyInstance, deps: FileDeps): void {
  app.route({
    method: 'GET',
    url: ASSISTANT_FILE.url,
    config: { access: 'session', failures: ASSISTANT_FILE.failures },
    handler: async (request, reply) => {
      const params = ASSISTANT_FILE.params.safeParse(request.params)
      if (!params.success) {
        throw new Failure('NOT_FOUND', { details: { reason: 'MALFORMED' }, cause: params.error })
      }
      const query = ASSISTANT_FILE.query.safeParse(request.query)
      if (!query.success) throw new Failure('REQUEST_MALFORMED', { cause: query.error })
      const owner = { companyId: params.data.companyId, personId: sessionOf(request).person.id }
      await deps.ownConversation(owner, params.data.conversationId)
      const { conversationId } = params.data
      const read = await deps.machines.read(
        conversationId,
        query.data.path,
        untilClientLeaves(reply),
      )
      // The browser left: nobody reads the answer, and the machine's read stopped.
      if (read.kind === 'CANCELLED') return reply.send()
      if (read.kind !== 'OK') throw new Failure(FILE_FAILURE[read.kind])
      deps.log.info(
        { companyId: owner.companyId, conversationId, bytes: read.bytes.length },
        'ASSISTANT_FILE_READ',
      )
      const name = posix.basename(query.data.path)
      const media = mediaOf(name)
      const disposition = INLINE_MEDIA.includes(media) ? 'inline' : 'attachment'
      return reply
        .header('content-type', media)
        .header(
          'content-disposition',
          `${disposition}; filename="${asciiOf(name)}"; filename*=UTF-8''${extendedOf(name)}`,
        )
        .header('x-content-type-options', 'nosniff')
        .header('content-security-policy', sandboxed(reply.getHeader('content-security-policy')))
        .send(read.bytes)
    },
  })
}
