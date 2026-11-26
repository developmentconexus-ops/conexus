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
  errored: 'Deu um erro no Hub e o pedido não foi enviado.',
  writeOpen: 'Um pedido igual pode já existir, e este não foi enviado.',
} as const

/** "O Pedidos quer lançar pedido no Sankhya": the agent, what it wants and the system. */
export function wantsText(agent: string, action: string, system: string): string {
  return `O ${agent} quer ${action.charAt(0).toLowerCase()}${action.slice(1)} no ${system}`
}

/** What the card says when the Hub could not tell whether the write entered: no verdict of its own, since the agent read what the system answered, and the mark to check. */
export function uncertainText(mark: string): string {
  return `Sem confirmação automática. Veja o que o agente leu e confira a observação ${mark}.`
}

/** The warning of an earlier send of the same write that has no answer, above the buttons. */
export function openWriteText(sentAt: string, mark: string): string {
  return `Um pedido foi enviado às ${hourOf(sentAt)} e não sabemos se entrou. Confira no Sankhya pela marca ${mark} antes de aprovar.`
}

/** The order the double or the system took, said under "Aprovado por você". */
export function launchedText(code: number): string {
  return `Pedido ${code} lançado, a confirmar.`
}

/** The words of the notebook's card (U19), from the state matrix. */
export const NOTE_TEXT = {
  title: 'Gravar no Caderno?',
  action: 'gravar no Caderno',
  concept: 'Conceito',
  mapping: 'Mapeamento',
  query: 'Consulta da prova',
  declined: 'Não gravado.',
  gone: 'Esta ligação não existe mais. Nada foi gravado.',
  ask: 'Peça a quem gerencia a ligação.',
} as const

export const NETWORK_TEXT = {
  title: 'O Conexus quer acessar a internet',
  domains: 'Domínios',
  reason: 'Motivo',
  endingIn: 'qualquer endereço que termina em ',
  butNot: ', menos o próprio ',
  conversation: 'Liberar nesta conversa',
  company: 'Liberar para a empresa',
  releasing: 'Liberando…',
  openedConversation: 'Liberado nesta conversa.',
  openedCompany: 'Liberado para a empresa.',
  refused: 'Recusado.',
  steer: 'Uma mensagem nova espera a sua resposta neste cartão.',
  notOpen: {
    ROLE: 'Só quem constrói ou administra libera um domínio. Peça ao dono ou a um administrador que libere em Configurações, Internet.',
    AUTOMATION:
      'Numa automação ninguém libera na hora. O dono ou um administrador libera em Configurações, Internet.',
    MACHINE_UNAVAILABLE: 'Liberado, mas a máquina não respondeu; a próxima tentativa aplica.',
    DATABASE: 'Não foi possível conferir a lista agora. Peça de novo daqui a pouco.',
  },
} as const
