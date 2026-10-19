import { z } from 'zod'
import { CompanyId, Revision } from './companies.ts'
import { PersonId } from './identity.ts'
import { defineOperation } from './operation.ts'

export const ModelAccountId = z.uuid().brand('ModelAccountId')
export type ModelAccountId = z.infer<typeof ModelAccountId>

export const SignInId = z.uuid().brand('SignInId')
export type SignInId = z.infer<typeof SignInId>

/** Whose account: the company's, or the person's own in that company (decision 0049). */
export const Owner = z.enum(['company', 'me'])
export type Owner = z.infer<typeof Owner>

export const AccountKind = z.enum(['api_key', 'claude_subscription', 'google_cliproxy'])
export type AccountKind = z.infer<typeof AccountKind>

/** The kinds the operators open per company; the API key is always open (founder, D9). */
export const SignInKind = AccountKind.exclude(['api_key'])
export type SignInKind = z.infer<typeof SignInKind>

/** `refused` is written by step 12's first refused call; step 11 links, pauses and resumes. */
export const AccountState = z.enum(['ready', 'paused', 'refused'])
export type AccountState = z.infer<typeof AccountState>

/** A provider id of the router's registry, such as `anthropic` (decision 0049). */
export const ProviderId = z
  .string()
  .regex(/^[a-z0-9][a-z0-9._-]{0,63}$/)
  .brand('ProviderId')
export type ProviderId = z.infer<typeof ProviderId>

/** The longest name a person gives an account, in characters. */
export const ACCOUNT_LABEL_MAX_LENGTH = 60
/** The longest key the Hub takes, in characters. */
export const ACCOUNT_KEY_MAX_LENGTH = 4096

export const Provider = z.object({
  id: ProviderId,
  name: z.string().min(1),
  models: z.array(z.string()),
})
export type Provider = z.infer<typeof Provider>

/**
 * An account as its readers see it, never its credential (decision 0049): a key shows only its last
 * four characters. `kindOff` says the operators closed its kind for the company; it stays and comes
 * back when they open it (founder, C2). `assignees` are the people a company account is given to;
 * with none it is "para todos". `linkedBy` is the name of who linked it, null once they left.
 */
export const ModelAccount = z.object({
  id: ModelAccountId,
  owner: Owner,
  kind: AccountKind,
  provider: ProviderId,
  label: z.string().min(1),
  position: z.number().int().nonnegative(),
  state: AccountState,
  kindOff: z.boolean(),
  hint: z.string().length(4).nullable(),
  linkedBy: z.string().nullable(),
  linkedAt: z.iso.datetime(),
  assignees: z.array(PersonId),
  revision: z.number().int().nonnegative(),
})
export type ModelAccount = z.infer<typeof ModelAccount>

/**
 * The person's order for one provider (P2): their own accounts, then the company's given to them,
 * in the company's position, then the company's for everyone. They reorder only their own.
 */
export const ProviderOrder = z.object({ provider: ProviderId, accounts: z.array(ModelAccountId) })
export type ProviderOrder = z.infer<typeof ProviderOrder>

const InCompany = z.object({ companyId: CompanyId })
const OfAccount = InCompany.extend({ accountId: ModelAccountId })
const OfQueue = InCompany.extend({ owner: Owner, provider: ProviderId })
const OfSignIn = InCompany.extend({ signInId: SignInId })

const Accounts = z.object({
  company: z.array(ModelAccount),
  mine: z.array(ModelAccount),
  order: z.array(ProviderOrder),
  kinds: z.array(SignInKind),
  defaultModel: z.string().nullable(),
  /** Whether the viewer changes the company's accounts and default model: the Hub's answer (C26). */
  mayManage: z.boolean(),
})

// The key is checked by the Hub, so an empty one is the same 422 as a provider off the list.
const Connection = z.object({
  owner: Owner,
  provider: z.string().max(64),
  label: z.string().max(ACCOUNT_LABEL_MAX_LENGTH * 4),
  key: z.string().max(ACCOUNT_KEY_MAX_LENGTH),
})
const Change = Revision.extend({
  label: z
    .string()
    .max(ACCOUNT_LABEL_MAX_LENGTH * 4)
    .optional(),
  state: z.enum(['ready', 'paused']).optional(),
})

const READ_FAILURES = ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'] as const

export const listModelAccounts = defineOperation({
  id: 'listModelAccounts',
  summary:
    'Lists the company’s model accounts and the person’s own, their order per provider, the open kinds and the default model.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/model-accounts',
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: Accounts },
  failures: READ_FAILURES,
})

export const listModelProviders = defineOperation({
  id: 'listModelProviders',
  summary: 'Lists the providers whose accounts link by an API key alone, with their models.',
  access: 'session',
  method: 'GET',
  path: '/api/model-providers',
  bodyLimit: 1024,
  success: { status: 200, body: z.object({ providers: z.array(Provider) }) },
  failures: ['SESSION_REQUIRED'],
})

export const connectModelAccount = defineOperation({
  id: 'connectModelAccount',
  summary:
    'Links an account by its API key at the end of its provider’s queue, sealing the key, with no call to the provider.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/model-accounts',
  bodyLimit: 16 * 1024,
  input: { params: InCompany, body: Connection },
  attemptKey: true,
  success: { status: 201, body: z.object({ account: ModelAccount }) },
  failures: [...READ_FAILURES, 'MODEL_ACCOUNT_INVALID', 'IDEMPOTENCY_CONFLICT'],
})

export const changeModelAccount = defineOperation({
  id: 'changeModelAccount',
  summary: 'Renames, pauses or resumes an account, at the revision the person read.',
  access: 'session',
  method: 'PATCH',
  path: '/api/companies/{companyId}/model-accounts/{accountId}',
  bodyLimit: 1024,
  input: { params: OfAccount, body: Change },
  success: { status: 200, body: z.object({ account: ModelAccount }) },
  failures: [...READ_FAILURES, 'MODEL_ACCOUNT_INVALID', 'MODEL_ACCOUNT_STALE'],
})

export const assignModelAccount = defineOperation({
  id: 'assignModelAccount',
  summary:
    'Gives a company account to these people, or to everyone with none; the list sent is the final one.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/model-accounts/{accountId}/assignees',
  bodyLimit: 16 * 1024,
  input: { params: OfAccount, body: z.object({ personIds: z.array(PersonId).max(500) }) },
  success: { status: 200, body: z.object({ account: ModelAccount }) },
  failures: [...READ_FAILURES, 'MODEL_ACCOUNT_PERSONAL'],
})

export const setDefaultModel = defineOperation({
  id: 'setDefaultModel',
  summary: 'Sets the company’s default model, any model of the router’s registry.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/default-model',
  bodyLimit: 1024,
  input: { params: InCompany, body: z.object({ model: z.string().max(200) }) },
  success: { status: 200, body: z.object({ defaultModel: z.string() }) },
  failures: [...READ_FAILURES, 'MODEL_UNKNOWN'],
})

export const orderModelAccounts = defineOperation({
  id: 'orderModelAccounts',
  summary: 'Orders one queue, one owner and one provider, by every one of its account ids.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/model-account-orders/{owner}/{provider}',
  bodyLimit: 16 * 1024,
  input: { params: OfQueue, body: z.object({ ids: z.array(ModelAccountId).max(500) }) },
  success: { status: 200, body: z.object({ accounts: z.array(ModelAccount) }) },
  failures: [...READ_FAILURES, 'MODEL_ACCOUNT_ORDER_STALE'],
})

export const removeModelAccount = defineOperation({
  id: 'removeModelAccount',
  summary: 'Removes an account and its sealed credential; removing it again answers the same.',
  access: 'session',
  method: 'DELETE',
  path: '/api/companies/{companyId}/model-accounts/{accountId}',
  bodyLimit: 1024,
  input: { params: OfAccount },
  success: { status: 204 },
  failures: READ_FAILURES,
})

const Kinds = z.object({ kinds: z.array(SignInKind) })
const OfClient = z.object({ companyId: CompanyId })

export const getAccountKinds = defineOperation({
  id: 'getAccountKinds',
  summary: 'Reads which sign-in kinds a client’s company may link, for the operator.',
  access: 'session',
  method: 'GET',
  path: '/api/clients/{companyId}/account-kinds',
  bodyLimit: 1024,
  input: { params: OfClient },
  success: { status: 200, body: Kinds },
  failures: READ_FAILURES,
})

export const setAccountKinds = defineOperation({
  id: 'setAccountKinds',
  summary:
    'Sets which sign-in kinds a client’s company may link, for the operator; the list sent is the final one.',
  access: 'session',
  method: 'PUT',
  path: '/api/clients/{companyId}/account-kinds',
  bodyLimit: 1024,
  input: { params: OfClient, body: Kinds },
  success: { status: 200, body: Kinds },
  failures: READ_FAILURES,
})

/** How long a started sign-in waits for its code, in seconds. */
export const SIGN_IN_SECONDS = 600

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
    body: z.object({ signInId: SignInId, url: z.url(), expiresAt: z.iso.datetime() }),
  },
  failures: [
    ...READ_FAILURES,
    'MODEL_ACCOUNT_INVALID',
    'MODEL_ACCOUNT_KIND_OFF',
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
    'MODEL_ACCOUNT_UNAVAILABLE',
    'CLIPROXY_UNAVAILABLE',
  ],
})
