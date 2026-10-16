import { z } from 'zod'
import { defineOperation } from './operation.ts'

/** The session cookie: `__Host-` makes the browser keep it to this origin, over HTTPS, at `/`. */
export const COOKIE_PREFIX = '__Host-conexus_'
export const SESSION_COOKIE = `${COOKIE_PREFIX}session`

export const PersonId = z.string().min(1).brand('PersonId')
export type PersonId = z.infer<typeof PersonId>

export const Email = z.email().brand('Email')
export type Email = z.infer<typeof Email>

export const Person = z.object({ id: PersonId, name: z.string().min(1), email: Email })
export type Person = z.infer<typeof Person>

const SignedIn = z.object({ person: Person })
/** A first password's length, which the form checks before it sends and the library again. */
export const PASSWORD_LENGTH = { min: 8, max: 128 } as const

export const createSession = defineOperation({
  id: 'createSession',
  summary: 'Signs a person in with e-mail and password and sets this browser’s session.',
  access: 'entry',
  method: 'PUT',
  path: '/api/sessions/current',
  bodyLimit: 4096,
  input: {
    body: z.object({ email: Email, password: z.string().min(1).max(PASSWORD_LENGTH.max) }),
  },
  success: { status: 200, body: SignedIn },
  failures: ['SIGN_IN_REFUSED', 'SIGN_IN_ATTEMPTS_EXCEEDED', 'DATABASE_UNAVAILABLE'],
})

/** Nobody signed in is an answer, not a refusal, as the library's own null session is. */
export const SessionState = z.discriminatedUnion('state', [
  z.object({ state: z.literal('SIGNED_IN'), person: Person }),
  z.object({ state: z.literal('SIGNED_OUT') }),
])
export type SessionState = z.infer<typeof SessionState>

export const getSession = defineOperation({
  id: 'getSession',
  summary: 'Reads who is signed in on this browser, or that nobody is.',
  access: 'public',
  method: 'GET',
  path: '/api/sessions/current',
  bodyLimit: 1024,
  success: { status: 200, body: SessionState },
  failures: ['DATABASE_UNAVAILABLE'],
})

export const deleteSession = defineOperation({
  id: 'deleteSession',
  summary: 'Ends this browser’s session on the server, then expires its cookie.',
  access: 'session',
  method: 'DELETE',
  path: '/api/sessions/current',
  bodyLimit: 1024,
  success: { status: 204 },
  failures: ['SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const setPassword = defineOperation({
  id: 'setPassword',
  summary: 'Sets a person’s first password with the token of their one-use link.',
  access: 'entry',
  method: 'PUT',
  path: '/api/passwords',
  bodyLimit: 4096,
  input: {
    body: z.object({
      token: z.string().min(1),
      password: z.string().min(PASSWORD_LENGTH.min).max(PASSWORD_LENGTH.max),
    }),
  },
  success: { status: 204 },
  failures: ['PASSWORD_LINK_INVALID', 'DATABASE_UNAVAILABLE'],
})
