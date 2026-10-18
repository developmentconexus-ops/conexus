import type { FailureRow } from './failure-row.ts'

/** The failures of opening a Projeto's app: the dispatcher shows each on the app's host (step 8). */
export const APP_FAILURES = {
  APP_HANDOFF_INVALID: {
    category: 'USER',
    settles: true,
    status: 403,
    phrase: 'Este link de acesso não vale mais.',
    action: 'Abra o app pelo Conexus.',
    actionKind: 'NONE',
  },
  APP_SESSION_INVALID: {
    category: 'USER',
    settles: true,
    status: 401,
    phrase: 'Sua entrada neste app terminou.',
    action: 'Abra o app pelo Conexus.',
    actionKind: 'NONE',
  },
  APP_ACCESS_REFUSED: {
    category: 'USER',
    settles: true,
    status: 403,
    phrase: 'Você não tem acesso a este app.',
    action: '',
    actionKind: 'NONE',
  },
  APP_NOT_FOUND: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Este app não existe.',
    action: '',
    actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>
