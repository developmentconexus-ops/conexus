import type { ModelId, TurnFailureCode } from '@conexus/hub-api'
import type { AccountRow, Context } from './accounts.ts'
import { isUsable, kindOpen } from './accounts.ts'
import { servesModel } from './served.ts'

/**
 * Where the accounts of a model stand for whoever may use them: one to call now, or why none:
 * in a limit until a time, out of credit, refused, or no account at all.
 */
export type Access =
  | { kind: 'usable'; account: AccountRow }
  | { kind: 'limited'; account: AccountRow; until: Date }
  | { kind: 'no-credit'; account: AccountRow }
  | { kind: 'refused'; account: AccountRow }
  | { kind: 'none' }

/**
 * The access `ordered` gives to `model`: the first account to call; else the rate limit that ends
 * first, as waiting brings it back; else a spent credit; else a refusal; else none. A paused account
 * and one of a closed kind count as none, as the person chose or was given.
 */
export function accessOf(ordered: AccountRow[], context: Context, model: ModelId): Access {
  const serving = ordered.filter((row) => kindOpen(row, context) && servesModel(row, model))
  const usable = serving.find((row) => isUsable(row, context))
  if (usable !== undefined) return { kind: 'usable', account: usable }
  const waiting = serving.filter((row) => row.state === 'ready' && row.limitedUntil !== null)
  const [rate] = waiting
    .filter((row) => row.limitReason !== 'credit')
    .sort((left, right) => Number(left.limitedUntil) - Number(right.limitedUntil))
  if (rate?.limitedUntil) return { kind: 'limited', account: rate, until: rate.limitedUntil }
  const [credit] = waiting
  if (credit !== undefined) return { kind: 'no-credit', account: credit }
  const refused = serving.find((row) => row.state === 'refused')
  if (refused !== undefined) return { kind: 'refused', account: refused }
  return { kind: 'none' }
}

/** The run's error at the turn's end, by where the model's accounts stand (`accessOf`). */
export const ENDS = {
  limited: 'MODEL_ACCOUNTS_LIMITED',
  'no-credit': 'MODEL_ACCOUNTS_NO_CREDIT',
  refused: 'MODEL_ACCOUNTS_REFUSED',
  none: 'MODEL_NO_ACCOUNT',
  // The ten calls ran out (`MAX_PROCESSOR_RETRIES`) with an account left: the next turn takes it.
  usable: 'MODEL_CALL_FAILED',
} as const satisfies Record<Access['kind'], TurnFailureCode>

/** The notice of a turn that ends with no account to call and no reason seen in it. */
export function accessText(access: Access, provider: string): string {
  const accounts = `As contas ${provider} que você pode usar`
  switch (access.kind) {
    case 'limited':
      return `${accounts} estão no limite até ${until(access.until)}.`
    case 'no-credit':
      return `${accounts} estão sem crédito.`
    case 'refused':
      return `${accounts} foram recusadas. Ligue de novo.`
    case 'usable':
    case 'none':
      return `${accounts} estão indisponíveis. Escolha outro modelo ou fale com quem administra a empresa.`
    default:
      return access satisfies never
  }
}

const TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
})

export function until(date: Date): string {
  return TIME.format(date).replace(':', 'h')
}
