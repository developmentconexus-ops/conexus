import { z } from 'zod'
import type { OAuth2CodeAuth } from './oauth.ts'
import type { Native, ProviderAnswer, ProviderRequest, TokenRequest } from './operation.ts'
import { locateOf } from './operation.ts'

/** `help`: one line and a public page on where the key comes from, shown in Ligar; `visible`: shown while pasted (an id), else masked. */
type Fields = Readonly<
  Record<
    string,
    Readonly<{
      label: string
      maxLength: number
      help: Readonly<{ text: string; url: `https://${string}` }>
      visible: boolean
    }>
  >
>
type Credential = Readonly<Record<string, string>>

/** A login by fields the company pastes, exchanged for a bearer token (Sankhya). */
export type ClientCredentialsAuth = Readonly<{
  kind: 'client_credentials'
  fields: Fields
  credential: z.ZodType<Credential> // strict, from `fields`
  token: Readonly<{
    path: `/${string}`
    form: Readonly<Record<string, Readonly<{ field: string }> | Readonly<{ value: string }>>>
    headers: Readonly<Record<string, Readonly<{ field: string }>>>
  }>
  answer: z.ZodType<Readonly<{ accessToken: string; expiresInSeconds: number }>>
  // The session's end, sent with the bearer while it lives (an expired token's logout is refused).
  logout?: Readonly<{ path: `/${string}`; query: Readonly<Record<string, string>>; body: unknown }>
}>
export type Auth = ClientCredentialsAuth | OAuth2CodeAuth

/** A header value cannot carry a line break, so a pasted field with one is refused where it is parsed. */
const oneLine = /^[^\r\n]*$/

/** The one way to declare a client-credentials login: the credential schema is built from `fields`, so the two cannot differ. */
export function clientCredentials(
  auth: Omit<ClientCredentialsAuth, 'kind' | 'credential'>,
): ClientCredentialsAuth {
  const shape = Object.fromEntries(
    Object.entries(auth.fields).map(([name, { maxLength }]) => [
      name,
      z.string().min(1).max(maxLength).regex(oneLine),
    ]),
  )
  return Object.freeze({
    ...auth,
    kind: 'client_credentials',
    credential: z.strictObject(shape),
  })
}

function fieldValue(credential: Credential, field: string): string {
  const found = credential[field]
  if (found === undefined) throw new Error(`Credential without field: ${field}`)
  return found
}

/** The token request, built from the opened values; the executor alone calls it, sends it and drops the values (S36). */
export function tokenRequest(auth: ClientCredentialsAuth, credential: Credential): TokenRequest {
  const form = new URLSearchParams(
    Object.fromEntries(
      Object.entries(auth.token.form).map(([name, source]) => [
        name,
        'field' in source ? fieldValue(credential, source.field) : source.value,
      ]),
    ),
  )
  const headers = Object.fromEntries(
    Object.entries(auth.token.headers).map(([name, { field }]) => [
      name,
      fieldValue(credential, field),
    ]),
  )
  return { method: 'POST', path: auth.token.path, query: {}, body: undefined, form, headers }
}

/** The logout of the token it is sent with, or null when the login declares none; the executor adds the bearer. */
export function logoutRequest(auth: ClientCredentialsAuth): ProviderRequest | null {
  if (auth.logout === undefined) return null
  const { path, query, body } = auth.logout
  return { method: 'POST', path, query, body }
}

/** What the login answered: a token, a refused key, or a body the kit cannot read. */
export type TokenAnswered =
  | Readonly<{ kind: 'OK'; accessToken: string; expiresInSeconds: number }>
  | Readonly<{ kind: 'AUTH_REFUSED' | 'UNREADABLE'; native: Native }>

/** At the login, 400, 401 and 403 all mean the key is refused (the OS did the same); anything else unreadable is not the key's fault. */
export function readToken(auth: ClientCredentialsAuth, answer: ProviderAnswer): TokenAnswered {
  const native = { status: answer.status, ...locateOf(answer.body), body: answer.body }
  if (answer.status === 400 || answer.status === 401 || answer.status === 403)
    return { kind: 'AUTH_REFUSED', native }
  if (answer.status < 200 || answer.status >= 300) return { kind: 'UNREADABLE', native }
  const token = auth.answer.safeParse(answer.body)
  return token.success
    ? { kind: 'OK', ...token.data }
    : { kind: 'UNREADABLE', native: { ...native, body: null } } // a 2xx body may hold a token: never carried
}
