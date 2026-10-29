import type { FailureRow } from './failure-row.ts'

/** The failures of taking a person out, of choosing a password (step 6) and of giving an app (step 18). */
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
  APP_ACCESS_MEMBER: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Esta pessoa já é da empresa e usa o app com todos os papéis.',
    action: '',
    actionKind: 'NONE',
  },
  APP_ACCESS_EXISTS: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Esta pessoa já usa o app. Troque o papel na lista.',
    action: '',
    actionKind: 'NONE',
  },
  APP_ROLE_UNKNOWN: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Este papel não existe na versão publicada.',
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
  PERSON_REMOVAL_PENDING: {
    category: 'THIRD_PARTY',
    settles: false,
    status: 503,
    phrase: 'As conversas da pessoa ainda não foram apagadas, e ela continua na empresa.',
    action: 'Tente de novo em alguns minutos.',
    actionKind: 'RETRY',
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
