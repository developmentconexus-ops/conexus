import type { Caller } from '@conexus/app-contract'
import { z } from 'zod'
import { HostLabel } from './address.ts'
import { CompanyId, LIBRARY_ID } from './companies.ts'
import { PersonId } from './identity.ts'
import { defineOperation } from './operation.ts'
import { ProjectId } from './projects.ts'

/** A one-use secret of the app's door, 32 random bytes in base64url: a pass, a binding, a session. */
const DoorSecret = z.string().regex(/^[A-Za-z0-9_-]{43}$/)

/** The header the dispatcher carries an app session in, from its `__Host-` cookie. */
export const APP_SESSION_HEADER = 'X-Conexus-App-Session'
/** Where the dispatcher redeems a pass on the app's host. */
export const HANDOFF_PATH = '/__conexus/passagem'
/** How long a pass is good for, in seconds (security S22). */
export const HANDOFF_SECONDS = 60
/** Where the dispatcher sends a browser for a pass: the Hub's one `handoff` route (security S48). */
export const APP_OPEN_PATH = '/apps/open'

/** Who calls the app, as the app sees it in `props`: never an e-mail, a company or a role. */
export const AppCaller = z.object({
  personId: PersonId,
  personName: z.string().min(1),
  projectId: ProjectId,
  projectName: z.string().min(1),
}) satisfies z.ZodType<Caller>
export type AppCaller = z.infer<typeof AppCaller>

const OnHost = z.object({ host: HostLabel })

/** The search of `APP_OPEN_PATH`: the app's host, and the hash of its binding cookie's secret. */
export const AppOpenQuery = OnHost.extend({ binding: DoorSecret })

/** The message the app's entry page sends the Hub's Prévia, from a frame with no app session. */
export const FRAME_ENTRY = 'conexus-entry'
export const FrameEntry = z.object({
  type: z.literal(FRAME_ENTRY),
  host: HostLabel,
  binding: z.string(),
})
export type FrameEntry = z.infer<typeof FrameEntry>

export const createAppFrameHandoff = defineOperation({
  id: 'createAppFrameHandoff',
  summary:
    'Gives the Prévia a pass to the app on the host, for the browser whose binding hash it names.',
  access: 'session',
  method: 'POST',
  path: '/api/apps/frame-handoff',
  bodyLimit: 1024,
  input: { body: AppOpenQuery },
  success: { status: 200, body: z.object({ location: z.url() }) },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const createAppSession = defineOperation({
  id: 'createAppSession',
  summary: 'Trades a pass, once, for a session of the app on the host and browser it was made for.',
  access: 'edge',
  method: 'POST',
  path: '/api/app-sessions',
  bodyLimit: 1024,
  input: { body: OnHost.extend({ code: DoorSecret, binding: DoorSecret }) },
  success: { status: 201, body: z.object({ session: DoorSecret }) },
  failures: ['APP_HANDOFF_INVALID', 'DATABASE_UNAVAILABLE'],
})

export const AppVersionId = z.string().regex(LIBRARY_ID).brand('AppVersionId')
export type AppVersionId = z.infer<typeof AppVersionId>

/** A version's Worker in the namespace, named by its id (decision 0043). */
export const AppWorker = z.string().regex(/^v-[A-Za-z0-9]{32}$/)
export function appWorkerOf(versionId: AppVersionId) {
  return AppWorker.parse(`v-${versionId}`)
}

/**
 * Where the app's run login reaches the company's database; its `search_path` names the app's
 * schema, and the password is the dispatcher's to derive (decision 0043).
 */
export const AppDatabase = z.object({
  host: z.string().min(1),
  database: z.string().min(1),
  login: z.string().min(1),
})

/**
 * What the dispatcher needs for one call: who calls, and either the live version's Worker with its
 * database, or the example app of step 8 when no version is on the air.
 */
export const AppCall = z.union([
  z.object({ caller: AppCaller, version: z.object({ worker: AppWorker }), database: AppDatabase }),
  z.object({
    caller: AppCaller,
    version: z.object({ example: z.literal(true) }),
    database: z.null(),
  }),
])
export type AppCall = z.infer<typeof AppCall>

export const checkAppCall = defineOperation({
  id: 'checkAppCall',
  summary:
    'Checks a call to an app against its session, the Hub session, the member and the Projeto.',
  access: 'edge',
  method: 'GET',
  path: '/api/app-sessions/current',
  bodyLimit: 1024,
  input: { query: OnHost },
  success: { status: 200, body: AppCall },
  failures: ['APP_SESSION_INVALID', 'APP_ACCESS_REFUSED', 'APP_NOT_FOUND', 'DATABASE_UNAVAILABLE'],
})

/** The session the dispatcher read from the app's cookie, parsed at the edge door. */
export const AppSessionToken = DoorSecret.brand('AppSessionToken')
export type AppSessionToken = z.infer<typeof AppSessionToken>

/**
 * How long the screen waits for a send's answer: the Worker's upload and the database's migrations
 * take seconds, so the Hub's usual deadline is too short; Cloudflare's edge cuts any answer at 100 s.
 */
export const VERSION_SEND_DEADLINE_MS = 100_000

/** The ceiling of a send's body: the version's 10 MB in base64, with the JSON around it. */
const VERSION_BODY_LIMIT = 14 * 1024 * 1024

/** Why a failed version did not enter: its code is the failure's, read by the screen (C48). */
export const AppVersionFailure = z.enum([
  'APP_VERSION_FAILED',
  'APP_VERSION_NOT_STARTING',
  'APP_MIGRATION_FAILED',
  'APP_MIGRATION_CHANGED',
])
export type AppVersionFailure = z.infer<typeof AppVersionFailure>

export const AppVersion = z.object({
  id: AppVersionId,
  number: z.int().positive(),
  state: z.enum(['sending', 'ready', 'failed']),
  failure: AppVersionFailure.nullable(),
  sentBy: z.string().min(1),
  /** The sender's name; null once that person left the company. */
  sentByName: z.string().min(1).nullable(),
  createdAt: z.iso.datetime(),
  live: z.boolean(),
})
export type AppVersion = z.infer<typeof AppVersion>

const OfProject = z.object({ companyId: CompanyId, projectId: ProjectId })

/** One file of the folder, as the screen read it; the Hub checks it against the manifest. */
export const VersionFileInput = z.object({
  path: z.string(),
  mediaType: z.string(),
  base64: z.base64(),
})
export type VersionFileInput = z.infer<typeof VersionFileInput>

export const createAppVersion = defineOperation({
  id: 'createAppVersion',
  summary:
    'Sends a version of a Projeto’s app, for an owner or administrator, and puts it on the air.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/projects/{projectId}/versions',
  bodyLimit: VERSION_BODY_LIMIT,
  input: {
    params: OfProject,
    body: z.object({ manifest: z.unknown(), files: z.array(VersionFileInput) }),
  },
  attemptKey: true,
  success: { status: 201, body: z.object({ version: AppVersion }) },
  failures: [
    'NOT_FOUND',
    'APP_VERSION_INVALID',
    'APP_VERSION_TOO_LARGE',
    'APP_VERSION_SENDING',
    'APP_VERSION_FAILED',
    'APP_VERSION_NOT_STARTING',
    'APP_MIGRATION_FAILED',
    'APP_MIGRATION_CHANGED',
    'IDEMPOTENCY_CONFLICT',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const listAppVersions = defineOperation({
  id: 'listAppVersions',
  summary: 'Lists the kept versions of a Projeto’s app, for an owner or administrator.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/projects/{projectId}/versions',
  bodyLimit: 1024,
  input: { params: OfProject },
  success: { status: 200, body: z.object({ versions: z.array(AppVersion) }) },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const setLiveVersion = defineOperation({
  id: 'setLiveVersion',
  summary: 'Puts a kept version of a Projeto’s app back on the air; the data stay as they are.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/projects/{projectId}/live-version',
  bodyLimit: 1024,
  input: { params: OfProject, body: z.object({ versionId: AppVersionId }) },
  success: { status: 200, body: z.object({ version: AppVersion }) },
  failures: [
    'NOT_FOUND',
    'APP_VERSION_NOT_FOUND',
    'APP_VERSION_SENDING',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})
