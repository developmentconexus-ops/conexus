import type { FailureRow } from './failure-row.ts'

const USER_409 = {
  category: 'USER',
  settles: true,
  status: 409,
  action: '',
  actionKind: 'NONE',
} as const
const USER_422 = {
  category: 'USER',
  settles: true,
  status: 422,
  action: '',
  actionKind: 'NONE',
} as const

/** The failures of marking a connection's tables for the lake copy (step "A primeira cópia chega ao lago", T.13). */
export const LAKE_COPY_FAILURES = {
  COPY_LAKE_NOT_READY: {
    ...USER_409,
    phrase: 'O lago desta empresa não está pronto. Peça ao operador do Conexus.',
  },
  COPY_RUN_OPEN: {
    ...USER_409,
    phrase: 'A ligação está copiando agora. Desmarque quando a rodada terminar.',
  },
  COPY_NAME_TAKEN: {
    ...USER_409,
    phrase: 'Outra tabela da empresa já tem este nome.',
  },
  COPY_NAME_FIXED: {
    ...USER_409,
    phrase: 'Uma tabela já copiada guarda o nome que tinha quando foi marcada.',
  },
  COPY_AWS_UNAVAILABLE: {
    category: 'THIRD_PARTY',
    settles: false,
    status: 503,
    phrase: 'Não deu para falar com a AWS agora.',
    action: 'Tente de novo em alguns minutos.',
    actionKind: 'RETRY',
  },
  COPY_TABLE_NOT_DECLARED: {
    ...USER_422,
    phrase: 'Este sistema não oferece essa tabela para copiar.',
  },
  COPY_NAME_INVALID: {
    ...USER_422,
    phrase: 'Use letras minúsculas sem acento, números e _, até 60.',
  },
  COPY_START_DATE_INVALID: {
    ...USER_422,
    phrase: 'A data não pode ser depois de hoje.',
  },
} as const satisfies Record<string, FailureRow>
