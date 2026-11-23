import type { FailureRow } from './failure-row.ts'

/** The failures of the Operations Central's clients, and of a client's data lake. */
export const CLIENT_FAILURES = {
  CLIENT_EXISTS: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Já existe um cliente com este CNPJ.',
    action: '',
    actionKind: 'NONE',
  },
  CLIENT_OWNER_IS_OPERATOR: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Este e-mail é de um operador da Conexus.',
    action: '',
    actionKind: 'NONE',
  },
  CLIENT_STALE: {
    category: 'USER',
    settles: true,
    status: 412,
    phrase: 'Este cliente mudou.',
    action: 'Recarregue a página.',
    actionKind: 'NONE',
  },
  CLIENT_NAME_MISMATCH: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'O nome não confere.',
    action: '',
    actionKind: 'NONE',
  },
  LAKE_BUSY: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'O lago está mudando agora. Espere terminar.',
    action: '',
    actionKind: 'NONE',
  },
  CLIENT_ACTIVE: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Este cliente já está ativo.',
    action: 'Recarregue a página.',
    actionKind: 'NONE',
  },
  OWNER_INVITATION_OPEN: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Já há um convite de dono em aberto.',
    action: 'Cancele-o antes de convidar outro e-mail.',
    actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>
