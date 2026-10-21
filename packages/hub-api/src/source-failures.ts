import type { FailureRow } from './failure-row.ts'

/** The failures of reading a Projeto's app files (step 13). */
export const SOURCE_FAILURES = {
  SOURCE_FILE_NOT_FOUND: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Não encontramos este arquivo nesta versão.',
    action: 'Escolha outro arquivo da lista.',
    actionKind: 'NONE',
  },
  SOURCE_FILE_NOT_TEXT: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Este arquivo não é um texto que dê para mostrar aqui.',
    action: 'Escolha outro arquivo da lista.',
    actionKind: 'NONE',
  },
  SOURCE_FILE_TOO_LARGE: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Este arquivo é grande demais para mostrar aqui.',
    action: 'Escolha outro arquivo da lista.',
    actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>
