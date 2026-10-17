import type { CompanyId } from '@conexus/hub-api'
import { createNeonClient, isNeonError } from '@neon/sdk'
import { z } from 'zod'
import type { Config } from './config.ts'
import type { FailureLog } from './failure.ts'
import { Failure } from './failure.ts'

export const NeonProjectId = z.string().min(1).brand('NeonProjectId')
export type NeonProjectId = z.infer<typeof NeonProjectId>

/** The name of a company's Neon project; the only one `find` and `create` accept (decision 0040). */
export const NeonProjectName = z
  .string()
  .regex(/^cx-[A-Za-z0-9]+$/)
  .brand('NeonProjectName')
export type NeonProjectName = z.infer<typeof NeonProjectName>

export function companyProjectName(companyId: CompanyId): NeonProjectName {
  return NeonProjectName.parse(`cx-${companyId}`)
}

/** What Neon said, which the caller must tell apart: a refusal leaves no effect, silence may leave one. */
type NeonAnswer<T> = { kind: 'DONE'; value: T } | { kind: 'REFUSED' } | { kind: 'NO_ANSWER' }

export type NeonProjects = {
  find(name: NeonProjectName): Promise<NeonAnswer<NeonProjectId[]>>
  create(name: NeonProjectName): Promise<NeonAnswer<NeonProjectId>>
  delete(id: NeonProjectId): Promise<NeonAnswer<'deleted'>>
}

// Measured in decision 0040: a create took 4.6 s; the budget is thirteen times that.
const REQUEST_TIMEOUT_MS = 15_000
const WAIT_TIMEOUT_MS = 45_000
/** The longest one call can take: its requests and retries, then the wait for the operation. */
export const NEON_CALL_BUDGET_MS = REQUEST_TIMEOUT_MS + WAIT_TIMEOUT_MS
const REPLY_CAP_BYTES = 1024 * 1024
const REGION_ID = 'aws-sa-east-1'
const PG_VERSION = 18

/** Ends a reply that passes the cap with an error, so the SDK never holds more than it (C59). */
function capReplies(inner: typeof fetch): typeof fetch {
  return async (input, init) => {
    const response = await inner(input, init)
    if (response.body === null) return response
    let size = 0
    const body = response.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          size += chunk.byteLength
          if (size > REPLY_CAP_BYTES) controller.error(new RangeError('reply too large'))
          else controller.enqueue(chunk)
        },
      }),
    )
    return new Response(body, response)
  }
}

/** The one adapter to Neon's API: only it imports the SDK, and the key leaves only into its client (C56, S36). */
export function createNeonProjects(deps: { config: Config; log: FailureLog }): NeonProjects {
  const { neonApiUrl, neonOrgId, neonApiKey } = deps.config
  const neon = createNeonClient({
    apiKey: neonApiKey.reveal(),
    baseUrl: neonApiUrl,
    orgId: neonOrgId,
    throwOnError: true,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
    wait: { timeoutMs: WAIT_TIMEOUT_MS },
    fetch: capReplies(fetch),
  })

  /**
   * Maps what the SDK threw. A bad key or a bad call is ours (`SYSTEM`); silence leaves the effect
   * unknown; any other answer is a refusal. A reply the SDK could not read, which it reports as an
   * `api` error on a 2xx status (a reply cut at the cap, say), is silence too: the call may have taken effect.
   */
  function mapped(error: unknown): { kind: 'REFUSED' } | { kind: 'NO_ANSWER' } {
    if (!isNeonError(error)) {
      deps.log.error({ reason: 'unreadable' }, 'NEON_FAILED')
      return { kind: 'NO_ANSWER' }
    }
    if (error.kind === 'auth' || error.kind === 'client') {
      throw new Failure('INTERNAL_UNEXPECTED', { cause: error })
    }
    const unreadable = error.kind === 'api' && error.status < 300
    const silent =
      unreadable || error.kind === 'timeout' || error.kind === 'network' || error.kind === 'aborted'
    deps.log.error({ reason: unreadable ? 'unreadable' : error.kind }, 'NEON_FAILED')
    return silent ? { kind: 'NO_ANSWER' } : { kind: 'REFUSED' }
  }

  return {
    async find(name) {
      try {
        const projects = await neon.projects.list({ search: name, org_id: neonOrgId }).all()
        const exact = projects.filter((project) => project.name === name)
        return { kind: 'DONE', value: exact.map((project) => NeonProjectId.parse(project.id)) }
      } catch (error) {
        return mapped(error)
      }
    },
    async create(name) {
      try {
        const project = await neon.projects.create({
          name,
          region_id: REGION_ID,
          pg_version: PG_VERSION,
          org_id: neonOrgId,
        })
        return { kind: 'DONE', value: NeonProjectId.parse(project.id) }
      } catch (error) {
        return mapped(error)
      }
    },
    async delete(id) {
      try {
        await neon.projects.delete({ projectId: id })
        return { kind: 'DONE', value: 'deleted' }
      } catch (error) {
        if (isNeonError(error) && error.kind === 'not_found') {
          return { kind: 'DONE', value: 'deleted' }
        }
        return mapped(error)
      }
    },
  }
}
