import type { FailureRow } from './failure-row.ts'

/** The failures of a file the Assistant wrote on its conversation's machine (step 24.1, U3). */
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
} as const satisfies Record<string, FailureRow>
