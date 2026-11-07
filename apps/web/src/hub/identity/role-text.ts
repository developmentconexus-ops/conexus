import type { ConnectorEntry, RoleView } from '@conexus/hub-api'

/** What a role does with an operation, in the words of the screen. */
export const EFFECT_WORD: Record<'READ' | 'WRITE' | 'DESTROY', string> = {
  READ: 'lê',
  WRITE: 'escreve',
  DESTROY: 'apaga',
}

const ALL_OF_ALL = 'Usa tudo de todos os conectores'
const READS_OF_ALL = 'Lê tudo de todos os conectores'
const NO_CONNECTORS = 'Não usa conectores.'
export const NO_USE = 'Não usa'
export const UNATTENDED_ACTION = 'Publicar agente que escreve sozinho'
export const UNATTENDED_HINT =
  'Quem tem esta ação deixa um agente publicado lançar uma escrita sem pedir “Aprovar?”.'
const SUBJECTS_NAMED = 2

type Kit = readonly Pick<ConnectorEntry, 'id' | 'name' | 'subjects'>[]

function operationsOf(entry: Kit[number]) {
  return entry.subjects.flatMap((subject) => subject.operations)
}

/** How many operations of a subject, in a phrase: "1 operação de Vendas". */
function countPhrase(count: number, subject: string): string {
  return `${count} ${count === 1 ? 'operação' : 'operações'} de ${subject}`
}

/** One connector's line for a role, short: "Sankhya: 1 operação de Vendas", or "Sankhya: 22 operações em 4 assuntos" when it spans many; nothing when the role uses none of it. */
function connectorLine(entry: Kit[number], held: readonly string[]): string | undefined {
  const parts = entry.subjects.flatMap((subject) => {
    const count = subject.operations.filter((operation) => held.includes(operation.id)).length
    return count === 0 ? [] : [{ count, label: subject.label }]
  })
  if (parts.length === 0) return undefined
  if (parts.length <= SUBJECTS_NAMED) {
    return `${entry.name}: ${parts.map((part) => countPhrase(part.count, part.label)).join(', ')}`
  }
  const total = parts.reduce((sum, part) => sum + part.count, 0)
  return `${entry.name}: ${total} operações em ${parts.length} assuntos`
}

/** The lines a role's row says: all of all, the reads of all, or one short line for each connector it uses. */
export function summaryOf(role: Pick<RoleView, 'connectors' | 'kind'>, kit: Kit): string[] {
  function held(entry: Kit[number]): readonly string[] {
    return Object.entries(role.connectors).find(([id]) => id === entry.id)?.[1] ?? []
  }
  const every = kit.flatMap(operationsOf)
  const chosen = kit.flatMap((entry) =>
    operationsOf(entry).filter((operation) => held(entry).includes(operation.id)),
  )
  if (role.kind === 'ALL') return [ALL_OF_ALL]
  const reads = every.filter((operation) => operation.effect === 'READ')
  const readsOnly = chosen.every((operation) => operation.effect === 'READ')
  if (chosen.length > 0 && chosen.length === every.length && !readsOnly) return [ALL_OF_ALL]
  if (reads.length > 0 && readsOnly && chosen.length === reads.length) return [READS_OF_ALL]
  const lines = kit.flatMap((entry) => connectorLine(entry, held(entry)) ?? [])
  return lines.length === 0 ? [NO_CONNECTORS] : lines
}

/** A stored name read as words, for the person who may not read the company's labels: "atendente-de-vendas" → "Atendente de vendas". */
export function wordsOfStoredName(role: string): string {
  const spaced = role.replaceAll('-', ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
