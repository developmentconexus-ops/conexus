import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { ProjectId } from './library-ids.ts'
import { defineOperation } from './operation.ts'

export const RequestId = z.uuid().brand('RequestId')
export type RequestId = z.infer<typeof RequestId>

/** The longest message of a request and reason of a refusal, in characters. */
export const REQUEST_MESSAGE_MAX = 280

/** A request waits until someone decides, cancels it or publishes another version (step 24.3.4). */
export const RequestState = z.enum(['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED', 'SUPERSEDED'])
export type RequestState = z.infer<typeof RequestState>

/**
 * The open request of a Projeto, as the reader sees it: `mayDecide` and `mayCancel` are the Hub's
 * answer for that reader (code C26).
 */
export const PublishRequest = z.object({
  id: RequestId,
  number: z.int().positive(),
  message: z.string().max(REQUEST_MESSAGE_MAX),
  requestedBy: z.object({ name: z.string() }),
  createdAt: z.iso.datetime(),
  mayDecide: z.boolean(),
  mayCancel: z.boolean(),
})
export type PublishRequest = z.infer<typeof PublishRequest>

export const Decision = z.discriminatedUnion('decision', [
  z.strictObject({ decision: z.literal('APPROVE') }),
  z.strictObject({
    decision: z.literal('DECLINE'),
    reason: z.string().max(REQUEST_MESSAGE_MAX).optional(),
  }),
])
export type Decision = z.infer<typeof Decision>

const OfProject = z.object({ companyId: CompanyId, projectId: ProjectId })
const OfRequest = z.object({ companyId: CompanyId, requestId: RequestId })

export const requestPublish = defineOperation({
  id: 'requestPublish',
  summary:
    'Asks an owner or an administrator to publish a kept version of a Projeto’s app, for a member who does not publish.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/projects/{projectId}/publish-request',
  bodyLimit: 2048,
  input: {
    params: OfProject,
    body: z.strictObject({
      number: z.int().positive(),
      message: z.string().max(REQUEST_MESSAGE_MAX),
    }),
  },
  attemptKey: true,
  success: { status: 201, body: z.object({ request: PublishRequest }) },
  failures: [
    'NOT_FOUND',
    'APP_VERSION_NOT_FOUND',
    'PUBLISH_REQUEST_ALREADY_LIVE',
    'PUBLISH_REQUEST_ALREADY_OPEN',
    'PUBLISH_REQUEST_NOT_NEEDED',
    'IDEMPOTENCY_CONFLICT',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const decidePublishRequest = defineOperation({
  id: 'decidePublishRequest',
  summary:
    'Approves a request, publishing its version, or declines it with an optional reason; for an owner or an administrator who did not ask.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/requests/{requestId}/decision',
  bodyLimit: 2048,
  input: { params: OfRequest, body: Decision },
  success: {
    status: 200,
    body: z.object({ state: z.enum([RequestState.enum.APPROVED, RequestState.enum.DECLINED]) }),
  },
  failures: [
    'NOT_FOUND',
    'PUBLISH_REQUEST_CLOSED',
    'PUBLISH_REQUEST_OWN',
    'APP_VERSION_NOT_FOUND',
    'CONNECTOR_NOT_GRANTED',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const cancelPublishRequest = defineOperation({
  id: 'cancelPublishRequest',
  summary: 'Withdraws an open request, for the person who asked.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/requests/{requestId}/cancel',
  bodyLimit: 1024,
  input: { params: OfRequest },
  success: { status: 204 },
  failures: ['NOT_FOUND', 'PUBLISH_REQUEST_CLOSED', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})
