import { z } from 'zod'
import type { Operation } from './operation.ts'

export const PersonId = z.string().min(1).brand('PersonId')
export type PersonId = z.infer<typeof PersonId>

export const Email = z.email().brand('Email')
export type Email = z.infer<typeof Email>

export const Person = z.object({ id: PersonId, name: z.string().min(1), email: Email })
export type Person = z.infer<typeof Person>

const SignedIn = z.object({ person: Person })
const PASSWORD_MAX_LENGTH = 128

export const createSession = {
  id: 'createSession',
  summary: 'Signs a person in with e-mail and password and sets this browser’s session.',
  access: 'entry',
  method: 'PUT',
  path: '/api/sessions/current',
  bodyLimit: 4096,
  input: {
    body: z.object({ email: Email, password: z.string().min(1).max(PASSWORD_MAX_LENGTH) }),
  },
  success: { status: 200, body: SignedIn },
  failures: ['SIGN_IN_REFUSED', 'SIGN_IN_ATTEMPTS_EXCEEDED', 'DATABASE_UNAVAILABLE'],
} as const satisfies Operation

export const getSession = {
  id: 'getSession',
  summary: 'Reads who is signed in on this browser.',
  access: 'session',
  method: 'GET',
  path: '/api/sessions/current',
  bodyLimit: 1024,
  success: { status: 200, body: SignedIn },
  failures: ['SESSION_REQUIRED'],
} as const satisfies Operation

export const deleteSession = {
  id: 'deleteSession',
  summary: 'Ends this browser’s session on the server, then expires its cookie.',
  access: 'session',
  method: 'DELETE',
  path: '/api/sessions/current',
  bodyLimit: 1024,
  success: { status: 204 },
  failures: ['SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
} as const satisfies Operation

export const setPassword = {
  id: 'setPassword',
  summary: 'Sets a person’s first password with the token of their one-use link.',
  access: 'entry',
  method: 'PUT',
  path: '/api/passwords',
  bodyLimit: 4096,
  input: {
    body: z.object({
      token: z.string().min(1),
      password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
    }),
  },
  success: { status: 204 },
  failures: ['PASSWORD_LINK_INVALID', 'PASSWORD_TOO_SHORT'],
} as const satisfies Operation
