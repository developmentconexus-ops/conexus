import { hourOf } from '../../platform/dates.ts'

/** The words of the card **Aprovar?**, from the state matrix of step 24.5 (the founder approves them at the end). */
export const APPROVAL_TEXT = {
  approve: 'Aprovar',
  decline: 'Recusar',
  approving: 'Aprovando…',
  declining: 'Recusando…',
  unsent: 'Não foi possível enviar. Tente de novo.',
  steer: 'Escrever outra mensagem recusa este pedido.',
  approved: 'Aprovado por você',
  declined: 'Recusado',
  interrupted: 'Recusado porque você mandou outra mensagem',
  stopped: 'Recusado porque você parou a conversa',
  failed: 'Não conseguiu lançar',
  refused: 'O sistema recusou o pedido.',
} as const

/** "O Pedidos quer lançar pedido no Sankhya": the agent, what it wants and the system. */
export function wantsText(agent: string, action: string, system: string): string {
  return `O ${agent} quer ${action.charAt(0).toLowerCase()}${action.slice(1)} no ${system}`
}

/** What the card says when the Hub could not tell whether the write entered: where to look for it. */
export function uncertainText(mark: string): string {
  return `Não deu para saber se o pedido foi lançado. Procure no Sankhya a observação ${mark}.`
}

/** The warning of an earlier send of the same write that has no answer, above the buttons. */
export function openWriteText(sentAt: string, mark: string): string {
  return `Um pedido foi enviado às ${hourOf(sentAt)} e não sabemos se entrou. Confira no Sankhya pela marca ${mark} antes de aprovar.`
}

/** The order the double or the system took, said under "Aprovado por você". */
export function launchedText(code: number): string {
  return `Pedido ${code} lançado, a confirmar.`
}
