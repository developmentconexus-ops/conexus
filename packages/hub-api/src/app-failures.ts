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

/** The failures of sending a version and putting one back on the air (step 9). */
export const APP_VERSION_FAILURES = {
  APP_VERSION_SENDING: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Já tem uma versão sendo enviada neste Projeto.',
    action: 'A próxima versão do Builder sobe quando o envio terminar.',
    actionKind: 'NONE',
  },
  APP_VERSION_FAILED: {
    category: 'THIRD_PARTY',
    settles: true,
    status: 502,
    phrase: 'A versão não entrou.',
    action: 'A próxima versão do Builder tenta de novo.',
    actionKind: 'NONE',
  },
  APP_MIGRATION_FAILED: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Uma migração do app falhou no banco.',
    action: 'Use o botão para pedir ao Builder que corrija.',
    actionKind: 'NONE',
  },
  // The fixed list of step 15 (B, 2026-10-27).
  APP_MIGRATION_REFUSED: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Uma migração do app faz o que o Conexus não confere.',
    action: 'Use o botão para pedir ao Builder que corrija.',
    actionKind: 'NONE',
  },
  // Decision 0046: Cloudflare refuses code that does not start before any migration runs.
  APP_VERSION_NOT_STARTING: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'O app não inicia.',
    action: 'Peça ao Builder para corrigir; a próxima versão que montar sobe sozinha.',
    actionKind: 'NONE',
  },
  APP_MIGRATION_CHANGED: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Uma migração já aplicada mudou.',
    action: 'Peça ao Builder uma migração nova, sem mudar a que já foi aplicada.',
    actionKind: 'NONE',
  },
  APP_VERSION_NOT_FOUND: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Essa versão não existe mais.',
    action: '',
    actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>
