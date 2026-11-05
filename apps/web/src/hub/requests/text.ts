import type { PublishRequest } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'

export const ONLY_DECIDERS = 'Só o dono e os administradores decidem pedidos.'
export const ALREADY_DECIDED = FAILURES.PUBLISH_REQUEST_CLOSED.phrase
export const UNCONFIRMED_ASK = 'Não confirmamos o pedido. Tente de novo.'

/** Who asked, from the reader's side: "Você pediu" to the one who can withdraw it. */
export function askedText(request: PublishRequest): string {
  return request.mayCancel
    ? `Você pediu para publicar a versão ${request.number}.`
    : `${request.requestedBy.name} pede para publicar a versão ${request.number}.`
}
