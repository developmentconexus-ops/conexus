import type { FailureRow } from './failure-row.ts'

/** The failures of taking a person out and of choosing a password (step 6). */
export const PEOPLE_FAILURES = {
  LAST_OWNER: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'A empresa precisa de pelo menos um dono.',
    action: 'Torne outra pessoa dona antes de sair.',
    actionKind: 'NONE',
  },
  MEMBER_STALE: {
    category: 'USER',
    settles: true,
    status: 412,
    phrase: 'Esta pessoa mudou de papel enquanto você olhava.',
    action: 'Veja a lista de novo.',
    actionKind: 'NONE',
  },
  PASSWORD_COMPROMISED: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Esta senha apareceu em vazamentos de dados.',
    action: 'Escolha outra senha.',
    actionKind: 'NONE',
  },
  PASSWORD_CHECK_UNAVAILABLE: {
    category: 'THIRD_PARTY',
    settles: false,
    status: 503,
    phrase: 'Não conseguimos conferir a senha agora.',
    action: 'Tente de novo em alguns minutos.',
    actionKind: 'RETRY',
  },
} as const satisfies Record<string, FailureRow>
