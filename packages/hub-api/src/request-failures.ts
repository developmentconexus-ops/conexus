import type { FailureRow } from './failure-row.ts'

export const REQUEST_FAILURES = {
  PUBLISH_REQUEST_ALREADY_LIVE: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Esta versão já está publicada.',
    action: 'Recarregue o Projeto.',
    actionKind: 'NONE',
  },
  PUBLISH_REQUEST_ALREADY_OPEN: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Já há um pedido aberto neste Projeto.',
    action: 'Recarregue o Projeto.',
    actionKind: 'NONE',
  },
  PUBLISH_REQUEST_NOT_NEEDED: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Você já pode publicar sem pedir.',
    action: 'Recarregue o Projeto.',
    actionKind: 'NONE',
  },
  PUBLISH_REQUEST_CLOSED: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Este pedido já foi decidido.',
    action: 'Recarregue o Projeto.',
    actionKind: 'NONE',
  },
  PUBLISH_REQUEST_OWN: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Quem pediu não decide o próprio pedido.',
    action: 'Outro dono ou administrador decide.',
    actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>
