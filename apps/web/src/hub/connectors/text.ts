import type { Connection, ConnectorEntry, KeptCheck, TestCheck } from '@conexus/hub-api'
import { clockOf, dayAndMonth } from '../../platform/dates.ts'

export const LEAD =
  'Ligue os sistemas da empresa e os apps do Conexus passam a ler os dados deles. O Conexus só lê.'
export const NO_CONNECTIONS = 'Nenhuma integração ligada ainda.'
export const MEMBER_SENTENCE = 'Só o dono ou um administrador liga, testa e desliga.'
export const NOT_TESTED_YET = 'Ainda não testada.'
export const UNREADABLE_TEXT = 'Resposta que o Conexus não entendeu'

/** The connector's name, or its id for one the catalog no longer holds. */
export function connectorName(connectors: readonly ConnectorEntry[], id: string): string {
  return connectors.find((one) => one.id === id)?.name ?? id
}

export function connectionsCount(count: number): string {
  return count === 1 ? '1 ligação' : `${count} ligações`
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

/** What a reader who may not manage the connections sees for the same refusal. */
export function refusedKeysMemberText(name: string): string {
  return `As chaves foram recusadas pelo ${name}. Peça ao dono ou a um administrador para ligar de novo.`
}

export function unreachableText(name: string): string {
  return `O ${name} não respondeu. Tente de novo em alguns minutos.`
}

/** The provider answered, with a server error of its own: it did answer, so it is not "não respondeu". */
export function serverErrorText(name: string): string {
  return `O ${name} respondeu com erro. Tente de novo em alguns minutos.`
}

export function testingText(reads: number): string {
  return `Testando as ${reads} leituras, uma por vez…`
}

/** What a part of the test found, in words (the founder's sentences, X6). */
export function outcomeText(check: TestCheck | KeptCheck, name: string): string {
  switch (check.outcome) {
    case 'READS':
      return 'Lê'
    case 'REFUSED':
      return `Recusada pelo ${name}`
    case 'UNREADABLE':
      return UNREADABLE_TEXT
    case 'NOTHING_TO_READ':
      return 'Lê, mas não havia nada para olhar'
    case 'NOT_TESTED':
      return `Não testada: o ${name} demorou. Teste de novo`
    case 'SOURCE_UNREAD':
      return `Não testada: depende de ${check.source}, que não leu`
  }
}

/** A part reads when the provider answered it, even with nothing in it. */
export function reads(check: TestCheck | KeptCheck): boolean {
  return check.outcome === 'READS' || check.outcome === 'NOTHING_TO_READ'
}

/** What to do next about a subject, by what its parts found (the study's hints, X6). */
export function hintText(items: readonly (TestCheck | KeptCheck)[], name: string): string {
  // Only a status that says the user lacks access: a 404 or 409 refused something else.
  if (
    items.some((one) => one.outcome === 'REFUSED' && 'native' in one && one.native.status === 403)
  ) {
    return `O usuário de integração não tem acesso a esta parte. Libere a tela no ${name} e teste de novo.`
  }
  if (items.some((one) => one.outcome === 'NOT_TESTED')) {
    return 'O tempo do teste acabou antes destas leituras. Teste de novo.'
  }
  if (items.some((one) => one.outcome === 'SOURCE_UNREAD')) {
    return 'Estas leituras partem de outra que não leu. Resolva aquela e teste de novo.'
  }
  return ''
}

/** What one subject comes to: the word on its line, its tone, and whether its parts stay shut. */
export function verdictOf(items: readonly (TestCheck | KeptCheck)[]): {
  text: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
  whole: boolean
} {
  const read = items.filter(reads).length
  if (read === items.length) return { text: 'Lê tudo', tone: 'success', whole: true }
  const bad = items.some((one) => one.outcome === 'REFUSED' || one.outcome === 'UNREADABLE')
  if (read > 0) return { text: `Lê ${read} de ${items.length}`, tone: 'warning', whole: false }
  return bad
    ? { text: 'Não lê', tone: 'danger', whole: false }
    : { text: 'Não testado', tone: 'neutral', whole: false }
}

/** The badge a connection wears on the list: the state, or "Lê em parte" when its last test left subjects open. */
export const PARTIAL_BADGE = 'Lê em parte'

export function wholeSubjectsText(whole: number, subjects: number): string {
  return `Lê ${whole} de ${subjects} assuntos inteiros`
}

/** "As outras 5 leem: Clientes, Vendedores" or "A outra lê: Tipos de pagamento". */
export function othersText(labels: readonly string[]): string {
  return labels.length === 1
    ? `A outra lê: ${labels[0]}.`
    : `As outras ${labels.length} leem: ${labels.join(', ')}.`
}

/** What the provider answered, on one line: "Sankhya respondeu 403, código ACESSO". */
export function nativeText(
  native: { status: number; code: string | null; message: string | null },
  name: string,
): string {
  const code = native.code === null ? '' : `, código ${native.code}`
  const message = native.message === null ? '' : `: ${native.message}`
  return `${name} respondeu ${native.status}${code}${message}`
}
