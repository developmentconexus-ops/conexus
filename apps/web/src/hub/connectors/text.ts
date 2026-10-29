import type { Connection, ConnectorEntry, TestCheck } from '@conexus/hub-api'
import { clockOf, dayAndMonth } from '../../platform/dates.ts'

export const NO_CONNECTIONS = 'Nenhuma integração ligada ainda.'
export const MEMBER_SENTENCE = 'Só a dona ou um administrador liga, testa e desliga.'

/** The connector's name, or its id for one the catalog no longer holds. */
export function connectorName(connectors: readonly ConnectorEntry[], id: string): string {
  return connectors.find((one) => one.id === id)?.name ?? id
}

/** The state as a badge, in words and a tone (design V35); a connection never tested has none. */
export function stateBadge(
  connection: Connection,
): { text: string; tone: 'success' | 'danger' } | null {
  if (connection.state === 'ACTIVE') return { text: 'Funcionando', tone: 'success' }
  return connection.state === 'NEEDS_REAUTH' ? { text: 'Chaves recusadas', tone: 'danger' } : null
}

/** "Ligada por Ana em 29/10", and ", ainda não testada" until the first test. */
export function linkedText(connection: Connection): string {
  const by = connection.linkedBy === null ? '' : ` por ${connection.linkedBy.name}`
  const tested = connection.state === 'NEW' ? ', ainda não testada' : ''
  return `Ligada${by} em ${dayAndMonth(connection.linkedAt)}${tested}`
}

/** "testada em 29/10, 14:02". */
export function testedText(testedAt: string): string {
  return `testada em ${dayAndMonth(testedAt)}, ${clockOf(testedAt)}`
}

export function refusedKeysText(name: string): string {
  return `As chaves foram recusadas pelo ${name}. Desligue e ligue de novo com chaves novas.`
}

export function unreachableText(name: string): string {
  return `O ${name} não respondeu. Tente de novo em alguns minutos.`
}

/** What a part of the test found, in words. */
export function outcomeText(check: TestCheck, name: string): string {
  switch (check.outcome) {
    case 'READS':
      return 'lê'
    case 'REFUSED':
      return `recusado pelo ${name}`
    case 'UNREADABLE':
      return 'resposta que o Conexus não entendeu'
    case 'NOTHING_TO_READ':
      return 'nada para ler'
  }
}
