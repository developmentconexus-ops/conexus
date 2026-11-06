type Lifetime = { after(cleanup: () => Promise<void> | void): void }

const ISSUER = 'https://auth.openai.com'
const USER_CODE_URL = `${ISSUER}/api/accounts/deviceauth/usercode`
const DEVICE_TOKEN_URL = `${ISSUER}/api/accounts/deviceauth/token`
const TOKEN_URL = `${ISSUER}/oauth/token`
const RESPONSES_URL = 'https://chatgpt.com/backend-api/codex/responses'

/** One answer of the double: the status, and the JSON body when it has one. */
export type CodexReply = { status: number; body?: unknown; headers?: Record<string, string> }

/** A call the process made to the vendor: which endpoint, and what it sent. */
export type CodexCall = {
  endpoint: 'usercode' | 'device-token' | 'token' | 'refresh' | 'responses'
  body: string
  headers: Headers
}

export type Codex = {
  calls: CodexCall[]
  /** Every other address the process fetched, passed on to the real `fetch`. */
  elsewhere: string[]
  /** The person has typed the code on the vendor's page: the device endpoint now grants. */
  typed: boolean
  usercode: () => CodexReply | Promise<CodexReply>
  deviceToken: () => CodexReply | Promise<CodexReply>
  exchange: () => CodexReply | Promise<CodexReply>
  /** The renewal at `oauth/token` (`grant_type=refresh_token`). */
  refresh: () => CodexReply | Promise<CodexReply>
  /** A model call at the Codex endpoint: only a status, as the stream's shape is the recording's (T24). */
  responses: () => CodexReply | Promise<CodexReply>
}

/** An unsigned token whose claims name a ChatGPT account, as the vendor's do; the content is invented. */
export function planted(claims: Record<string, unknown>): string {
  return `${part({ alg: 'none' })}.${part(claims)}.planted`
}

function part(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

export const ACCOUNT_ID = 'planted-chatgpt-account'
export const ACCESS = 'planted-codex-access-token'
export const REFRESH = 'planted-codex-refresh-token'
export const RENEWED_ACCESS = 'planted-codex-renewed-access-token'
export const RENEWED_REFRESH = 'planted-codex-renewed-refresh-token'
export const USER_CODE = 'ABCD-1234'

/**
 * Stands in for `auth.openai.com` at `fetch` (testing T14): the device flow's start, its poll (403
 * until the code is typed, as the vendor answers) and the code trade, in the shapes the Codex reads.
 * The content is invented (security S40). Every call is recorded.
 */
export function plantCodex(t: Lifetime): Codex {
  const real = globalThis.fetch
  const codex: Codex = {
    calls: [],
    elsewhere: [],
    typed: false,
    usercode: () => ({
      status: 200,
      body: { device_auth_id: 'planted-device-auth', user_code: USER_CODE, interval: '5' },
    }),
    deviceToken: () =>
      codex.typed
        ? {
            status: 200,
            body: { authorization_code: 'planted-code', code_verifier: 'planted-pkce' },
          }
        : { status: 403 },
    exchange: () => ({
      status: 200,
      body: {
        access_token: ACCESS,
        refresh_token: REFRESH,
        expires_in: 3600,
        id_token: planted({ 'https://api.openai.com/auth': { chatgpt_account_id: ACCOUNT_ID } }),
      },
    }),
    // A renewal that names no account: the Hub keeps the one the old tokens named.
    refresh: () => ({
      status: 200,
      body: { access_token: RENEWED_ACCESS, refresh_token: RENEWED_REFRESH, expires_in: 3600 },
    }),
    responses: () => ({ status: 500 }),
  }
  const endpoints = [
    [USER_CODE_URL, 'usercode', () => codex.usercode()],
    [DEVICE_TOKEN_URL, 'device-token', () => codex.deviceToken()],
    [TOKEN_URL, 'token', () => codex.exchange()],
    [TOKEN_URL, 'refresh', () => codex.refresh()],
    [RESPONSES_URL, 'responses', () => codex.responses()],
  ] as const
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    const body = String(init?.body)
    const refreshing = new URLSearchParams(body).get('grant_type') === 'refresh_token'
    const endpoint = endpoints.find(
      ([address, name]) =>
        address === url && (name === 'refresh') === (url === TOKEN_URL && refreshing),
    )
    if (endpoint === undefined) {
      codex.elsewhere.push(url)
      return real(input, init)
    }
    const [, name, answer] = endpoint
    codex.calls.push({ endpoint: name, body, headers: new Headers(init?.headers) })
    init?.signal?.throwIfAborted()
    const { status, body: reply, headers } = await answer()
    return reply === undefined
      ? new Response(null, { status, headers })
      : Response.json(reply, { status, headers })
  }
  t.after(() => {
    globalThis.fetch = real
  })
  return codex
}
