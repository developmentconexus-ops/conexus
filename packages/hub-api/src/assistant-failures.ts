import type { FailureRow } from './failure-row.ts'

/** The failures of a file the Assistant wrote on its conversation's machine (step 24.1, U3), and of a hand-off to the Builder (step 24.3.2, U2). */
export const ASSISTANT_FAILURES = {
  FILE_NOT_FOUND: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Este arquivo não está mais na máquina da conversa.',
    action: '',
    actionKind: 'NONE',
  },
  FILE_TOO_LARGE: {
    category: 'USER',
    settles: true,
    status: 413,
    phrase: 'O arquivo passa do tamanho que o Hub entrega.',
    action: '',
    actionKind: 'NONE',
  },
  FILE_GONE: {
    category: 'SYSTEM',
    settles: true,
    status: 410,
    phrase: 'A máquina desta conversa não guarda mais este arquivo.',
    action: '',
    actionKind: 'NONE',
  },
  // A change to the company's memory refused because another changed the page meanwhile
  // (alignment of the Assistant, U9): the screen reads it again.
  COMPANY_MEMORY_CHANGED: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'A página mudou enquanto você apagava.',
    action: '',
    actionKind: 'NONE',
  },
  HANDOFF_NOT_DELIVERED: {
    category: 'SYSTEM',
    // The key is kept (W24): the touch again finds the Projeto and the conversation, and sends.
    settles: false,
    status: 503,
    phrase: 'O Builder não recebeu a proposta.',
    action: 'O Projeto e a conversa ficam. Tente de novo.',
    actionKind: 'RETRY',
  },
} as const satisfies Record<string, FailureRow>
