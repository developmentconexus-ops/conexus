import { z } from 'zod'
import {
  ACCOUNT_KEY_MAX_LENGTH,
  ACCOUNT_LABEL_MAX_LENGTH,
  InCompany,
  ModelAccount,
  Owner,
  READ_FAILURES,
  SignInId,
  SignInKind,
} from './model-accounts.ts'
import { defineOperation } from './operation.ts'

const OfSignIn = InCompany.extend({ signInId: SignInId })

/** How each sign-in kind comes back: a pasted code, or a code typed on the vendor's page. One owner. */
export const SIGN_IN_ENTRY = {
  claude_subscription: 'paste',
  google_cliproxy: 'paste',
  openai_codex: 'device',
} as const satisfies Record<SignInKind, 'paste' | 'device'>

export type PasteKind = {
  [K in SignInKind]: (typeof SIGN_IN_ENTRY)[K] extends 'paste' ? K : never
}[SignInKind]
export type DeviceKind = Exclude<SignInKind, PasteKind>

export const DEVICE_KINDS: readonly DeviceKind[] = SignInKind.options.filter(
  (kind): kind is DeviceKind => SIGN_IN_ENTRY[kind] === 'device',
)

export function isDeviceKind(kind: SignInKind): kind is DeviceKind {
  return SIGN_IN_ENTRY[kind] === 'device'
}

export const startModelAccountSignIn = defineOperation({
  id: 'startModelAccountSignIn',
  summary:
    'Starts a subscription sign-in for an account of the company or of the person, and gives the address to open.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/model-account-sign-ins',
  bodyLimit: 1024,
  input: {
    params: InCompany,
    body: z.object({
      owner: Owner,
      kind: SignInKind,
      label: z.string().max(ACCOUNT_LABEL_MAX_LENGTH * 4),
    }),
  },
  success: {
    status: 201,
    body: z.discriminatedUnion('entry', [
      z.object({
        entry: z.literal('paste'),
        signInId: SignInId,
        url: z.url(),
        expiresAt: z.iso.datetime(),
      }),
      z.object({
        entry: z.literal('device'),
        signInId: SignInId,
        url: z.url(),
        userCode: z.string().min(1).max(32),
        retryMs: z.number().int().positive(),
        expiresAt: z.iso.datetime(),
      }),
    ]),
  },
  failures: [
    ...READ_FAILURES,
    'MODEL_ACCOUNT_LABEL_INVALID',
    'MODEL_ACCOUNT_KIND_OFF',
    'MODEL_ACCOUNT_REFUSED',
    'MODEL_ACCOUNT_UNAVAILABLE',
    'CLIPROXY_BINARY_REFUSED',
    'CLIPROXY_UNAVAILABLE',
  ],
})

export const completeModelAccountSignIn = defineOperation({
  id: 'completeModelAccountSignIn',
  summary:
    'Completes a sign-in with the code or address the vendor showed, sealing what it returns as a new account.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/model-account-sign-ins/{signInId}',
  bodyLimit: 16 * 1024,
  input: { params: OfSignIn, body: z.object({ code: z.string().max(ACCOUNT_KEY_MAX_LENGTH) }) },
  success: { status: 201, body: z.object({ account: ModelAccount }) },
  failures: [
    ...READ_FAILURES,
    'MODEL_ACCOUNT_KIND_OFF',
    'MODEL_ACCOUNT_REFUSED',
    'MODEL_ACCOUNT_SIGN_IN_EXPIRED',
    'MODEL_ACCOUNT_SIGN_IN_WRONG_ENTRY',
    'MODEL_ACCOUNT_UNAVAILABLE',
    'CLIPROXY_UNAVAILABLE',
  ],
})

export const pollModelAccountSignIn = defineOperation({
  id: 'pollModelAccountSignIn',
  summary:
    'Asks once whether the person has typed the code the vendor showed, and links the account when they have.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/model-account-sign-ins/{signInId}/poll',
  bodyLimit: 1024,
  input: { params: OfSignIn },
  success: {
    status: 200,
    body: z.discriminatedUnion('status', [
      z.object({ status: z.literal('waiting'), retryMs: z.number().int().positive() }),
      z.object({ status: z.literal('linked'), account: ModelAccount }),
    ]),
  },
  failures: [
    ...READ_FAILURES,
    'MODEL_ACCOUNT_KIND_OFF',
    'MODEL_ACCOUNT_REFUSED',
    'MODEL_ACCOUNT_SIGN_IN_EXPIRED',
    'MODEL_ACCOUNT_SIGN_IN_WRONG_ENTRY',
    'MODEL_ACCOUNT_UNAVAILABLE',
  ],
})
