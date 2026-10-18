import type { ProjectId } from './projects.ts'

/**
 * The schema and the two logins of a Projeto's app in its company's database (decision 0021): one
 * runs the app, one applies its migrations. Each name keeps the Projeto's id as it is, so SQL quotes
 * it; a login never exists in another company's project, so the derived password opens nothing there.
 */
export function appLogin(projectId: ProjectId) {
  return Object.freeze({
    schema: `app_${projectId}`,
    runLogin: `app_${projectId}_run`,
    migrateLogin: `app_${projectId}_migrate`,
  })
}
export type AppLogin = ReturnType<typeof appLogin>

function base64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

/**
 * A login's password, `HMAC-SHA-256(key, login)` in base64url (decision 0043): the Hub and the
 * dispatcher derive the same one, so no password is stored or sent, and a repeated creation sets
 * the same one again. Web Crypto, which both runtimes have.
 */
export async function appLoginPassword(input: Readonly<{ key: string; login: string }>) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(input.key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return base64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(input.login)))
}
