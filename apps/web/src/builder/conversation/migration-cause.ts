import type { MigrationCause } from '@conexus/hub-api'

/** What each SQLSTATE says in the person's words; never the database's message (code C52). */
const WORDS: Readonly<Record<string, string>> = {
  '23505': 'valor repetido',
  '23502': 'campo vazio',
  '23514': 'valor fora da regra',
  '22P02': 'valor que não converte',
  '22008': 'valor que não converte',
  '2BP01': 'outra tabela depende desta',
  CX001: 'a versão anterior deixaria de abrir',
  CX002: 'um valor salvo mudaria ou sumiria',
}

/** A `CX002` that names no column: the guarantee found whole rows gone, not one value changed. */
const ROWS_GONE = 'linhas salvas seriam apagadas'

/** The cause in words, without a value: the SQLSTATE's words, then the names the database gave. */
export function reasonOf(cause: MigrationCause): string {
  if (cause.kind === 'rule') {
    return `a migração ${cause.migration}, comando ${cause.statement}, faz o que o Conexus não confere (${cause.subject})`
  }
  const rowsGone =
    cause.sqlstate === 'CX002' && cause.table !== undefined && cause.column === undefined
  const names = [
    cause.table === undefined ? undefined : `tabela ${cause.table}`,
    cause.column === undefined ? undefined : `coluna ${cause.column}`,
    cause.constraint === undefined ? undefined : `regra ${cause.constraint}`,
  ]
  return [
    rowsGone ? ROWS_GONE : (WORDS[cause.sqlstate] ?? `código ${cause.sqlstate}`),
    ...names.filter(Boolean),
  ].join(', ')
}

/** The sentence the button puts in the box for the Builder. */
export function askOf(number: number, cause: MigrationCause): string {
  const reason = reasonOf(cause)
  return cause.kind === 'rule'
    ? `A versão ${number} não entrou: ${reason}.`
    : `A versão ${number} não entrou: o banco recusou a migração (${reason}).`
}
