import { isValidCpf, isValidEmail, isValidPhone } from '@brazilian-utils/brazilian-utils'

/** The kinds of personal data a connector's read may carry, fixed for every connector (step "a política de dados pessoais"). */
export const PERSONAL_KINDS = ['contato', 'endereco', 'documento', 'sensivel'] as const
export type PersonalKind = (typeof PERSONAL_KINDS)[number]

/** Um caminho com ponto relativo a cada linha de `linhas`, ou ao valor quando ele não tem `linhas`. */
export type PersonalField = Readonly<{ path: string; kind: PersonalKind }>

type Undeclared = Readonly<{ path: string; kind: 'documento' | 'contato' }>

/** The rows a declaration's paths are relative to (each of `linhas`, or the value itself) and the answer rebuilt from them once shaped. */
export function personalRowsOf(value: unknown) {
  if (typeof value === 'object' && value !== null && 'linhas' in value) {
    const { linhas } = value
    if (Array.isArray(linhas)) {
      const rows: unknown[] = linhas
      return { rows, rebuilt: (shaped: unknown[]): unknown => ({ ...value, linhas: shaped }) }
    }
  }
  return { rows: [value], rebuilt: (shaped: unknown[]): unknown => shaped[0] }
}

/** The declared fields that hold a column's or leaf's path: the field's own path or one above it, the most specific first. */
export function personalHolding(
  declared: readonly PersonalField[],
  path: string,
): readonly PersonalField[] {
  return declared
    .filter((field) => path === field.path || path.startsWith(`${field.path}.`))
    .sort((a, b) => b.path.length - a.path.length)
}

/** A CPF may come as a JSON number: an integer of up to 11 digits is read as its 11 digits. */
function knownShapeOf(leaf: unknown): Undeclared['kind'] | null {
  if (typeof leaf === 'number')
    return Number.isSafeInteger(leaf) && leaf > 0 && isValidCpf(String(leaf).padStart(11, '0'))
      ? 'documento'
      : null
  if (typeof leaf !== 'string') return null
  if (isValidCpf(leaf)) return 'documento'
  if (isValidEmail(leaf)) return 'contato'
  return /^\d{10,13}$/.test(leaf) && isValidPhone(leaf) ? 'contato' : null
}

/** Each leaf of a row with its dotted path; an array is walked through, its index not in the path. */
function leavesOf(value: unknown, path: string, found: { path: string; leaf: unknown }[]) {
  if (Array.isArray(value)) for (const item of value) leavesOf(item, path, found)
  else if (typeof value === 'object' && value !== null)
    for (const [key, item] of Object.entries(value))
      leavesOf(item, path === '' ? key : `${path}.${key}`, found)
  else found.push({ path, leaf: value })
  return found
}

/** As formas conhecidas achadas num valor fora dos caminhos dados: caminho e tipo, nunca o valor. */
export function findUndeclared(
  value: unknown,
  declared: readonly PersonalField[],
): readonly Undeclared[] {
  const seen = new Map<string, Undeclared>()
  for (const row of personalRowsOf(value).rows)
    for (const { path, leaf } of leavesOf(row, '', [])) {
      const kind = personalHolding(declared, path).length > 0 ? null : knownShapeOf(leaf)
      if (kind !== null) seen.set(`${path}:${kind}`, { path, kind })
    }
  return [...seen.values()]
}
