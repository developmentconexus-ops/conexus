import type { ConnectorEntry, OperationEffect, RoleView } from '@conexus/hub-api'

/** What a role does with an operation, in the words of the screen. */
export const EFFECT_WORD: Record<OperationEffect, string> = {
  READ: 'lê',
  WRITE: 'escreve',
  DESTROY: 'apaga',
}

export const ALL_OF_ALL = 'Usa tudo de todos os conectores'
export const READS_OF_ALL = 'Lê tudo de todos os conectores'
export const NO_CONNECTORS = 'Não usa conectores.'
export const NO_USE = 'Não usa'

type Kit = readonly Pick<ConnectorEntry, 'id' | 'name' | 'subjects'>[]

function operationsOf(entry: Kit[number]) {
  return entry.subjects.flatMap((subject) => subject.operations)
}

/** How many operations of a subject, in a phrase: "1 operação de Vendas". */
function countPhrase(count: number, subject: string): string {
  return `${count} ${count === 1 ? 'operação' : 'operações'} de ${subject}`
}

/** One connector's line for a role: "Sankhya: 1 operação de Vendas", or nothing when the role uses none of it. */
export function connectorLine(entry: Kit[number], held: readonly string[]): string | undefined {
  const parts = entry.subjects.flatMap((subject) => {
    const count = subject.operations.filter((operation) => held.includes(operation.id)).length
    return count === 0 ? [] : [countPhrase(count, subject.label)]
  })
  return parts.length === 0 ? undefined : `${entry.name}: ${parts.join(', ')}`
}

/** The lines a role's row says: all of all, the reads of all, or one line for each connector it uses. */
export function summaryOf(role: Pick<RoleView, 'connectors'>, kit: Kit): string[] {
  const held = (entry: Kit[number]): readonly string[] =>
    Object.entries(role.connectors).find(([id]) => id === entry.id)?.[1] ?? []
  const everyOperation = kit.flatMap(operationsOf)
  const chosen = kit.flatMap((entry) =>
    operationsOf(entry).filter((operation) => held(entry).includes(operation.id)),
  )
  if (everyOperation.length > 0 && chosen.length === everyOperation.length) return [ALL_OF_ALL]
  const reads = everyOperation.filter((operation) => operation.effect === 'READ')
  const onlyReads = chosen.every((operation) => operation.effect === 'READ')
  if (reads.length > 0 && onlyReads && chosen.length === reads.length) return [READS_OF_ALL]
  const lines = kit.flatMap((entry) => connectorLine(entry, held(entry)) ?? [])
  return lines.length === 0 ? [NO_CONNECTORS] : lines
}

/** A stored name read as words, for the person who may not read the company's labels: "atendente-de-vendas" → "Atendente de vendas". */
export function wordsOfStoredName(role: string): string {
  const spaced = role.replaceAll('-', ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
