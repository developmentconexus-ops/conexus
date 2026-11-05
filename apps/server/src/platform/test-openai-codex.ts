type Lifetime = { after(cleanup: () => Promise<void> | void): void }

const ISSUER = 'https://auth.openai.com'
const USER_CODE_URL = `${ISSUER}/api/accounts/deviceauth/usercode`
const DEVICE_TOKEN_URL = `${ISSUER}/api/accounts/deviceauth/token`
const TOKEN_URL = `${ISSUER}/oauth/token`

/** One answer of the double: the status, and the JSON body when it has one. */
export type CodexReply = { status: number; body?: unknown }

/** A call the process made to the vendor: which endpoint, and what it sent. */
export type CodexCall = { endpoint: 'usercode' | 'device-token' | 'token'; body: string }

export type Codex = {
  calls: CodexCall[]
  /** Every other address the process fetched, passed on to the real `fetch`. */
  elsewhere: string[]
  /** The person has typed the code on the vendor's page: the device endpoint now grants. */
  typed: boolean
  usercode: () => CodexReply | Promise<CodexReply>
  deviceToken: () => CodexReply | Promise<CodexReply>
  exchange: () => CodexReply | Promise<CodexReply>
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
  }
  const endpoints = [
    [USER_CODE_URL, 'usercode', () => codex.usercode()],
    [DEVICE_TOKEN_URL, 'device-token', () => codex.deviceToken()],
    [TOKEN_URL, 'token', () => codex.exchange()],
  ] as const
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    const endpoint = endpoints.find(([address]) => address === url)
    if (endpoint === undefined) {
      codex.elsewhere.push(url)
      return real(input, init)
    }
    const [, name, answer] = endpoint
    codex.calls.push({ endpoint: name, body: String(init?.body) })
    const { status, body } = await answer()
    return body === undefined ? new Response(null, { status }) : Response.json(body, { status })
  }
  t.after(() => {
    globalThis.fetch = real
  })
  return codex
}
