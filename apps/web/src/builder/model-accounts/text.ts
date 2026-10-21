import type {
  AccountKind,
  Effort,
  ModelAccount,
  ModelDefault,
  PersonId,
  Provider,
  ProviderId,
  StartSource,
} from '@conexus/hub-api'
import { providerOfModel } from '@conexus/hub-api'
import { hourOf } from '../../platform/dates.ts'
import { writeFailureText } from '../../platform/hub.ts'
import { modelLabel } from './model-label.ts'

export const KIND_NAMES = {
  api_key: 'Chave de API',
  claude_subscription: 'Assinatura Claude',
  google_cliproxy: 'Google',
} as const satisfies Record<AccountKind, string>

/** A person of the company as the assignment lists them. */
export type Person = { personId: PersonId; name: string }

const UNCONFIRMED = 'Não confirmamos a mudança. Veja a lista.'

/** What a failed write says: a refusal the Hub settled in its words, any other as one that may have saved. */
export function refusalText(error: unknown): string {
  return writeFailureText(error, UNCONFIRMED)
}

/** The provider's name, or its id for one the key list does not hold, such as a subscription's. */
export function providerName(providers: readonly Provider[], id: ProviderId): string {
  return providers.find((one) => one.id === id)?.name ?? id
}

/** The state in words (design V35); the Conexus closing the kind is told before the rest. */
export function stateText(account: ModelAccount): string {
  if (account.kindOff) return 'desligada pela Conexus'
  if (account.state === 'refused') return 'recusada · Ligue de novo'
  if (account.state === 'paused') return 'pausada'
  return account.limitedUntil === null ? 'ligada' : `No limite até ${hourOf(account.limitedUntil)}`
}

/** How the account was linked: the end of its key, or the kind of sign-in. */
export function originText(account: ModelAccount): string {
  return account.hint === null ? KIND_NAMES[account.kind] : `chave …${account.hint}`
}

/** "para todos", or whom a company account is kept for. */
export function audienceText(account: ModelAccount, people: readonly Person[]): string {
  if (account.assignees.length === 0) return 'para todos'
  const names = account.assignees.map(
    (id) => people.find((person) => person.personId === id)?.name ?? 'outra pessoa',
  )
  return `reservada para ${names.join(', ')}`
}

/** The accounts of one provider, in their queue's order. */
export function queueOf(accounts: readonly ModelAccount[], provider: ProviderId): ModelAccount[] {
  return accounts.filter((one) => one.provider === provider).sort((a, b) => a.position - b.position)
}

/** The providers that hold at least one of the accounts, in the order they first appear. */
export function providersOf(accounts: readonly ModelAccount[]): ProviderId[] {
  return [...new Set(accounts.map((one) => one.provider))]
}

/** Matches without caring for case or accents, as a person types a name. */
export function plain(text: string): string {
  return text
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** What a person reads for each reasoning level a model accepts. */
export const EFFORT_LABELS = {
  off: 'Desligado',
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
  xhigh: 'Muito alto',
  max: 'Máximo',
} as const satisfies Record<Effort, string>

/** "Claude Sonnet 4.5 · Alto": a model and the level it starts at. */
export function choiceText(choice: ModelDefault): string {
  return `${modelLabel(choice.model)} · ${EFFORT_LABELS[choice.effort]}`
}

/** Where a new conversation's start comes from, as the line that names it ends. */
export const START_SOURCE_TEXT = {
  mine: 'seu padrão',
  company: 'padrão da empresa',
  starter: 'modelo inicial',
} as const satisfies Record<StartSource, string>

/** The name of the provider of `provider/model`, or the id when the list does not hold it. */
export function modelProviderName(providers: readonly Provider[], model: ModelDefault['model']) {
  const id = providerOfModel(model)
  return providers.find((one) => one.id === id)?.name ?? id ?? model
}
