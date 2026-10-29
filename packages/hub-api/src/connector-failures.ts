import type { FailureRow } from './failure-row.ts'

/** The failures of a company's connections to outside systems (step 19). */
export const CONNECTOR_FAILURES = {
  CONNECTOR_UNKNOWN: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Esse conector não existe no Conexus.',
    action: '',
    actionKind: 'NONE',
  },
  CONNECTION_CREDENTIAL_INVALID: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Confira os campos: cole cada chave inteira.',
    action: '',
    actionKind: 'NONE',
  },
  CONNECTION_EXISTS: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Essa integração já está ligada nesta empresa.',
    action: '',
    actionKind: 'NONE',
  },
  CONNECTION_NOT_FOUND: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Essa integração foi desligada.',
    action: '',
    actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>
