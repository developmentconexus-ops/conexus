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
  APP_VERSION_INVALID: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'A pasta não é uma versão do Conexus.',
    action: 'Escolha a pasta montada pelo app.',
    actionKind: 'NONE',
  },
  APP_VERSION_TOO_LARGE: {
    category: 'USER',
    settles: true,
    status: 413,
    phrase: 'A versão passa de 10 MB ou de 1.000 arquivos.',
    action: '',
    actionKind: 'NONE',
  },
  APP_VERSION_SENDING: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Já tem uma versão sendo enviada neste Projeto.',
    action: 'Espere ela terminar.',
    actionKind: 'NONE',
  },
  // A failed version is final: "Tentar de novo" is a new send, with a new key.
  APP_VERSION_FAILED: {
    category: 'THIRD_PARTY',
    settles: true,
    status: 502,
    phrase: 'A versão não entrou.',
    action: 'Tente de novo.',
    actionKind: 'RETRY',
  },
  APP_MIGRATION_FAILED: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Uma migração do app falhou no banco.',
    action: 'Corrija e envie de novo.',
    actionKind: 'NONE',
  },
  // Decision 0046: Cloudflare refuses code that does not start before any migration runs.
  APP_VERSION_NOT_STARTING: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'O app não inicia.',
    action: 'Corrija o código e envie de novo.',
    actionKind: 'NONE',
  },
  APP_MIGRATION_CHANGED: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Uma migração já aplicada mudou.',
    action: 'Crie uma migração nova.',
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
