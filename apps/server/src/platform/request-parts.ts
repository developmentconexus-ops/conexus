import type { Operation } from '@conexus/hub-api'
import { ATTEMPT_KEY_HEADER, AttemptKey, EventId, LAST_EVENT_ID_HEADER } from '@conexus/hub-api'
import type { FastifyRequest } from 'fastify'
import { Failure } from './failure.ts'

/**
 * The path parameters are read first: an id that cannot exist is the same not-found as one that
 * does not, and it costs no query (code C42, security S10).
 */
export function partsOf(operation: Operation, request: FastifyRequest) {
  const { params, query, body } = operation.input ?? {}
  const parsedParams = params?.safeParse(request.params)
  if (parsedParams?.success === false) {
    throw new Failure('NOT_FOUND', { details: { reason: 'MALFORMED' }, cause: parsedParams.error })
  }
  const key = operation.attemptKey
    ? AttemptKey.safeParse(request.headers[ATTEMPT_KEY_HEADER.toLowerCase()])
    : undefined
  if (key?.success === false) throw new Failure('REQUEST_MALFORMED', { cause: key.error })
  const parsedQuery = query?.safeParse(request.query)
  if (parsedQuery?.success === false)
    throw new Failure('REQUEST_MALFORMED', { cause: parsedQuery.error })
  const parsedBody = body?.safeParse(request.body)
  if (parsedBody?.success === false)
    throw new Failure('REQUEST_MALFORMED', { cause: parsedBody.error })
  // Opaque to the platform: the operation that issued the id reads it (code C28).
  const resumable = 'events' in operation.success && operation.success.resumable === true
  const sentId = resumable
    ? EventId.safeParse(request.headers[LAST_EVENT_ID_HEADER.toLowerCase()])
    : undefined
  return {
    params: parsedParams?.data,
    query: parsedQuery?.data,
    body: parsedBody?.data,
    attemptKey: key?.data,
    lastEventId: sentId && (sentId.success ? sentId.data : null),
  }
}
