import type { FailureRow } from './failure-row.ts'

/** The failures of creating and deleting a Project, the company's database, and a client's deletion in phases (step 7). */
export const PROJECT_FAILURES = {
  PROJECT_NAME_TAKEN: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Já existe um Projeto com esse nome nesta empresa.',
    action: 'Escolha outro nome.',
    actionKind: 'NONE',
  },
  PROJECT_ADDRESS_TAKEN: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Já existe um Projeto com esse endereço nesta empresa.',
    action: 'Mude o nome.',
    actionKind: 'NONE',
  },
  PROJECT_NAME_NO_ADDRESS: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'O nome precisa ter ao menos três letras ou números.',
    action: '',
    actionKind: 'NONE',
  },
  PROJECT_NAME_MISMATCH: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'O nome não confere.',
    action: '',
    actionKind: 'NONE',
  },
  COMPANY_DATABASE_PREPARING: {
    category: 'USER',
    settles: false,
    status: 409,
    phrase: 'O banco da empresa está sendo preparado.',
    action: 'Tente de novo em alguns segundos.',
    actionKind: 'RETRY',
  },
  COMPANY_DATABASE_UNAVAILABLE: {
    category: 'THIRD_PARTY',
    settles: false,
    status: 503,
    phrase: 'Não foi possível preparar o banco da empresa agora.',
    action: 'Tente de novo em alguns minutos.',
    actionKind: 'RETRY',
  },
  PROJECT_DELETION_PENDING: {
    category: 'THIRD_PARTY',
    settles: false,
    status: 503,
    phrase: 'O Projeto saiu, mas as conversas dele ainda não foram apagadas.',
    action: 'O Conexus termina sozinho ao reiniciar; tente excluir de novo.',
    actionKind: 'RETRY',
  },
  CLIENT_DELETION_PENDING: {
    category: 'THIRD_PARTY',
    settles: false,
    status: 503,
    phrase: 'A exclusão começou, mas o banco da empresa ainda não saiu.',
    action: 'Tente concluir a exclusão.',
    actionKind: 'RETRY',
  },
} as const satisfies Record<string, FailureRow>
