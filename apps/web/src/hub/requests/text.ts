import type { PublishRequest } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { ageOf } from '../../platform/dates.ts'

export const ONLY_DECIDERS = 'Só o dono e os administradores decidem pedidos.'
export const ALREADY_DECIDED = FAILURES.PUBLISH_REQUEST_CLOSED.phrase
export const UNCONFIRMED_ASK = 'Não confirmamos o pedido. Tente de novo.'

/** Who asked, from the reader's side: "Você pediu" to the one who can withdraw it. */
export function askedText(request: PublishRequest): string {
  return request.mayCancel
    ? `Você pediu para publicar a versão ${request.number}.`
    : `${request.requestedBy.name} pede para publicar a versão ${request.number}.`
}

/** How long ago, in a sentence's own words: "há 2 min", "ontem", "em 28/10". */
export function agoText(createdAt: string, now = new Date()): string {
  const age = ageOf(createdAt, now)
  if (age === 'ontem') return age
  return /^\d+ (min|h|d)$/.test(age) ? `há ${age}` : `em ${age}`
}
