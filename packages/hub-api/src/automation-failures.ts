import type { FailureRow } from './failure-row.ts'

/** The failures of the Assistant's automations and of their runs (step 24.2). */
export const AUTOMATION_FAILURES = {
  AUTOMATION_NOT_FOUND: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Não encontramos esta automação.',
    action: 'Volte às automações.',
    actionKind: 'INITIAL',
  },
  AUTOMATION_LIMIT: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'A empresa chegou a 30 automações ativas.',
    action: 'Pause ou apague uma.',
    actionKind: 'NONE',
  },
  AUTOMATION_RUNNING: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Esta automação já está rodando.',
    action: 'Espere ela terminar.',
    actionKind: 'NONE',
  },
  INTERRUPTED: {
    category: 'SYSTEM',
    settles: true,
    status: 503,
    phrase: 'A execução foi interrompida antes do fim.',
    action: 'Rode a automação de novo.',
    actionKind: 'NONE',
  },
  SCHEDULE_PUBLISH_FAILED: {
    category: 'SYSTEM',
    settles: true,
    status: 503,
    phrase: 'A automação não conseguiu começar no horário.',
    action: 'Ela roda de novo no próximo horário.',
    actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>
