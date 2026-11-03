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
  HANDOFF_NOT_DELIVERED: {
    category: 'SYSTEM',
    settles: true,
    status: 503,
    phrase: 'O Builder não recebeu a proposta.',
    action: 'O Projeto e a conversa ficam. Tente de novo.',
    actionKind: 'RETRY',
  },
} as const satisfies Record<string, FailureRow>
