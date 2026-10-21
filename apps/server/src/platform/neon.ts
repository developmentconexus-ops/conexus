import type { CompanyId, CompanyNickname } from '@conexus/hub-api'
import { createNeonClient, isNeonError } from '@neon/sdk'
import { z } from 'zod'
import type { Config } from './config.ts'
import { DatabaseUrl } from './database.ts'
import type { FailureLog } from './failure.ts'
import { Failure } from './failure.ts'

export const NeonProjectId = z.string().min(1).brand('NeonProjectId')
export type NeonProjectId = z.infer<typeof NeonProjectId>

/**
 * The name of a company's Neon project, `<nickname>-<companyId>`: the console shows the nickname,
 * and the exact `-<companyId>` ending is the key `find` reads (decision 0048).
 */
export const NeonProjectName = z
  .string()
  .max(64)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*-[A-Za-z0-9]{32}$/)
  .brand('NeonProjectName')
export type NeonProjectName = z.infer<typeof NeonProjectName>

export function companyProjectName(input: {
  nickname: CompanyNickname
  companyId: CompanyId
}): NeonProjectName {
  return NeonProjectName.parse(`${input.nickname}-${input.companyId}`)
}

/** Whether a project's name ends in the company's key, the old `cx-<companyId>` included (0048). */
function isCompanys(name: string, companyId: CompanyId): boolean {
  return name.endsWith(`-${companyId}`)
}

/** A project as Neon lists it: its id, and its name, which a person may read as it was or is now. */
export type NeonProject = { id: NeonProjectId; name: string }

/** What Neon said, which the caller must tell apart: a refusal leaves no effect, silence may leave one. */
type NeonAnswer<T> = { kind: 'DONE'; value: T } | { kind: 'REFUSED' } | { kind: 'NO_ANSWER' }

export type NeonProjects = {
  /** The projects whose names end exactly in `-<companyId>`. */
  find(companyId: CompanyId): Promise<NeonAnswer<NeonProject[]>>
  /** Every project of the companies' organization (decision 0040 T3A). */
  list(): Promise<NeonAnswer<NeonProject[]>>
  create(name: NeonProjectName): Promise<NeonAnswer<NeonProjectId>>
  /** `gone` when Neon no longer has the project, which a deletion meanwhile leaves. */
  rename(id: NeonProjectId, name: NeonProjectName): Promise<NeonAnswer<'renamed' | 'gone'>>
  delete(id: NeonProjectId): Promise<NeonAnswer<'deleted'>>
  /** The owner login's address, its password read now for one act and never kept (0043). */
  ownerConnection(id: NeonProjectId): Promise<NeonAnswer<DatabaseUrl>>
}

// The role and database Neon makes with each project; once apps' logins exist, the SDK must be told
// which role's address it gives (decision 0043).
const OWNER_ROLE = 'neondb_owner'
/** The database each company's project holds, where its apps' schemas live. */
export const COMPANY_DATABASE = 'neondb'

// Measured in decision 0040: a create took 4.6 s; the budget is thirteen times that.
const REQUEST_TIMEOUT_MS = 15_000
const WAIT_TIMEOUT_MS = 45_000
/** The longest one call can take: its requests and retries, then the wait for the operation. */
export const NEON_CALL_BUDGET_MS = REQUEST_TIMEOUT_MS + WAIT_TIMEOUT_MS
/** The longest a creation holds Neon: the `find` by the company's key, then the `create`. */
export const NEON_PREPARE_BUDGET_MS = REQUEST_TIMEOUT_MS + NEON_CALL_BUDGET_MS
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

/**
 * Maps what the SDK threw. A bad key or a bad call is ours (`SYSTEM`); silence leaves the effect
 * unknown; any other answer is a refusal. A reply the SDK could not read, which it reports as an
 * `api` error on a 2xx status (a reply cut at the cap, say), is silence too: the call may have taken effect.
 */
function mapped(log: FailureLog, error: unknown): { kind: 'REFUSED' } | { kind: 'NO_ANSWER' } {
  if (!isNeonError(error)) {
    log.error({ reason: 'unreadable' }, 'NEON_FAILED')
    return { kind: 'NO_ANSWER' }
  }
  if (error.kind === 'auth' || error.kind === 'client') {
    throw new Failure('INTERNAL_UNEXPECTED', { cause: error })
  }
  const unreadable = error.kind === 'api' && error.status < 300
  const silent =
    unreadable || error.kind === 'timeout' || error.kind === 'network' || error.kind === 'aborted'
  log.error({ reason: unreadable ? 'unreadable' : error.kind }, 'NEON_FAILED')
  return silent ? { kind: 'NO_ANSWER' } : { kind: 'REFUSED' }
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

  /** Neon's `search` matches a piece of a name or an id; only the Hub's comparison is exact. */
  async function listed(search?: string): Promise<NeonProject[]> {
    const projects = await neon.projects.list({ org_id: neonOrgId, search }).all()
    return projects.map((project) => ({ id: NeonProjectId.parse(project.id), name: project.name }))
  }

  return {
    async find(companyId) {
      try {
        const projects = await listed(companyId)
        const exact = projects.filter((project) => isCompanys(project.name, companyId))
        return { kind: 'DONE', value: exact }
      } catch (error) {
        return mapped(deps.log, error)
      }
    },
    async list() {
      try {
        return { kind: 'DONE', value: await listed() }
      } catch (error) {
        return mapped(deps.log, error)
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
        return mapped(deps.log, error)
      }
    },
    async rename(id, name) {
      try {
        await neon.projects.update({ projectId: id, name })
        return { kind: 'DONE', value: 'renamed' }
      } catch (error) {
        if (isNeonError(error) && error.kind === 'not_found') return { kind: 'DONE', value: 'gone' }
        return mapped(deps.log, error)
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
        return mapped(deps.log, error)
      }
    },
    async ownerConnection(id) {
      try {
        const url = await neon.postgres.connectionString({
          projectId: id,
          pooled: false,
          roleName: OWNER_ROLE,
          databaseName: COMPANY_DATABASE,
        })
        return { kind: 'DONE', value: DatabaseUrl.parse(url) }
      } catch (error) {
        return mapped(deps.log, error)
      }
    },
  }
}
