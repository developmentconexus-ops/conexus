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
  CONNECTION_NAME_INVALID: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Dê um nome à ligação, de até 60 letras.',
    action: '',
    actionKind: 'NONE',
  },
  CONNECTION_NAME_TAKEN: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Já existe uma ligação desse conector com esse nome. Dê outro nome.',
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
