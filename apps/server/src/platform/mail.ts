import type { Email } from '@conexus/hub-api'
import { z } from 'zod'
import type { Config } from './config.ts'
import type { FailureLog } from './failure.ts'
import { Failure } from './failure.ts'

export type MailMessage = { to: Email; subject: string; text: string }
export type SendMail = (
  message: MailMessage,
  signal: AbortSignal,
) => Promise<'DELIVERED' | 'QUEUED'>

/** The name every message carries beside the configured address (founder, 2026-10-15). */
const SENDER_NAME = 'Conexus'
const DEADLINE_MS = 10_000
const REPLY_CAP_BYTES = 16 * 1024

const SendReply = z.discriminatedUnion('success', [
  z.object({ success: z.literal(false) }),
  z.object({
    success: z.literal(true),
    result: z.object({
      delivered: z.array(z.string()),
      permanent_bounces: z.array(z.string()),
      queued: z.array(z.string()),
    }),
  }),
])

type Refusal = 'status' | 'unsuccessful' | 'shape' | 'too-large' | 'unreachable'

/** Reads at most the cap; past it, it stops reading and answers undefined (C59). */
async function cappedText(body: ReadableStream<Uint8Array> | null): Promise<string | undefined> {
  if (body === null) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of body) {
    size += chunk.byteLength
    if (size > REPLY_CAP_BYTES) return undefined
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

/** The one adapter to the mail provider: one request, no retry, sent as the installation (C56, C58). */
export function createMail(deps: { config: Config; log: FailureLog }): SendMail {
  const { mailApiUrl, mailFrom, mailToken } = deps.config

  function refuse(reason: Refusal, cause?: unknown, status?: number): never {
    deps.log.error({ reason, ...(status === undefined ? {} : { status }) }, 'MAIL_FAILED')
    throw new Failure('MAIL_UNAVAILABLE', { cause })
  }

  async function reply(message: MailMessage, signal: AbortSignal): Promise<unknown> {
    const response = await fetch(mailApiUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${mailToken.reveal()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        to: message.to,
        from: { address: mailFrom, name: SENDER_NAME },
        subject: message.subject,
        text: message.text,
      }),
      signal,
      redirect: 'error',
    })
    if (!response.ok) {
      await response.body?.cancel()
      return refuse('status', undefined, response.status)
    }
    const text = await cappedText(response.body)
    if (text === undefined) return refuse('too-large')
    try {
      return JSON.parse(text)
    } catch (error) {
      return refuse('shape', error)
    }
  }

  return async (message, signal) => {
    let body: unknown
    try {
      body = await reply(message, AbortSignal.any([AbortSignal.timeout(DEADLINE_MS), signal]))
    } catch (error) {
      if (error instanceof Failure) throw error
      return refuse('unreachable', error)
    }
    const parsed = SendReply.safeParse(body)
    if (!parsed.success) return refuse('shape', parsed.error)
    if (!parsed.data.success) return refuse('unsuccessful')
    const { delivered, permanent_bounces, queued } = parsed.data.result
    if (permanent_bounces.length > 0) {
      deps.log.info({ outcome: 'BOUNCED' }, 'MAIL_FAILED')
      throw new Failure('MAIL_BOUNCED')
    }
    if (delivered.length > 0) {
      deps.log.info({ outcome: 'DELIVERED' }, 'MAIL_SENT')
      return 'DELIVERED'
    }
    if (queued.length > 0) {
      deps.log.info({ outcome: 'QUEUED' }, 'MAIL_SENT')
      return 'QUEUED'
    }
    return refuse('shape')
  }
}
