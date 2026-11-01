import type { FailureRow } from './failure-row.ts'

/** The failures of a file the Assistant wrote on its conversation's machine (step 24.1, U3). */
export const ASSISTANT_FAILURES = {
  FILE_NOT_FOUND: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Não encontramos este arquivo na conversa.',
    action: 'Peça ao Assistente para mostrá-lo de novo.',
    actionKind: 'NONE',
  },
  FILE_TOO_LARGE: {
    category: 'USER',
    settles: true,
    status: 413,
    phrase: 'Este arquivo é grande demais para baixar aqui.',
    action: 'Peça ao Assistente um arquivo menor.',
    actionKind: 'NONE',
  },
  FILE_GONE: {
    category: 'SYSTEM',
    settles: true,
    status: 410,
    phrase: 'Os arquivos desta conversa não estão mais na máquina dela.',
    action: 'Peça ao Assistente para refazê-lo.',
    actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>
