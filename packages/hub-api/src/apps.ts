import type { Caller } from '@conexus/app-contract'
import { z } from 'zod'
import { HostLabel } from './address.ts'
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

/** Who calls the app, as the app sees it in `props`: never an e-mail, a company or a role. */
export const AppCaller = z.object({
  personId: PersonId,
  personName: z.string().min(1),
  projectId: ProjectId,
  projectName: z.string().min(1),
}) satisfies z.ZodType<Caller>
export type AppCaller = z.infer<typeof AppCaller>

const OnHost = z.object({ host: HostLabel })

export const createAppHandoff = defineOperation({
  id: 'createAppHandoff',
  summary: 'Gives a person of the company a one-use pass to the app of a Projeto on its host.',
  access: 'session',
  method: 'POST',
  path: '/api/apps/handoffs',
  bodyLimit: 1024,
  // The binding is the hash of the secret only the browser's cookie on the app's host holds.
  input: { body: OnHost.extend({ binding: DoorSecret }) },
  success: { status: 201, body: z.object({ location: z.url({ protocol: /^https$/ }) }) },
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

export const checkAppCall = defineOperation({
  id: 'checkAppCall',
  summary:
    'Checks a call to an app against its session, the Hub session, the member and the Projeto.',
  access: 'edge',
  method: 'GET',
  path: '/api/app-sessions/current',
  bodyLimit: 1024,
  input: { query: OnHost },
  success: { status: 200, body: z.object({ caller: AppCaller }) },
  failures: ['APP_SESSION_INVALID', 'APP_ACCESS_REFUSED', 'APP_NOT_FOUND', 'DATABASE_UNAVAILABLE'],
})

/** The session the dispatcher read from the app's cookie, parsed at the edge door. */
export const AppSessionToken = DoorSecret.brand('AppSessionToken')
export type AppSessionToken = z.infer<typeof AppSessionToken>
