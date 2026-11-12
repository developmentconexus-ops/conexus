import { isValidCpf, isValidEmail, isValidPhone } from '@brazilian-utils/brazilian-utils'

/** The kinds of personal data a connector's read may carry, fixed for every connector (step "a política de dados pessoais"). */
export const PERSONAL_KINDS = ['contato', 'endereco', 'documento', 'sensivel'] as const
export type PersonalKind = (typeof PERSONAL_KINDS)[number]

/** Um caminho com ponto relativo a cada linha de `linhas`, ou ao valor quando ele não tem `linhas`. */
export type PersonalField = Readonly<{ path: string; kind: PersonalKind }>

type Undeclared = Readonly<{ path: string; kind: 'documento' | 'contato' }>

/** The rows a declaration's paths are relative to: each of `linhas`, or the value itself. */
export function personalRowsOf(value: unknown): readonly unknown[] {
  if (typeof value === 'object' && value !== null && 'linhas' in value) {
    const { linhas } = value
    if (Array.isArray(linhas)) return linhas
  }
  return [value]
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
  function covered(path: string) {
    return declared.some((field) => path === field.path || path.startsWith(`${field.path}.`))
  }
  const seen = new Map<string, Undeclared>()
  for (const row of personalRowsOf(value))
    for (const { path, leaf } of leavesOf(row, '', [])) {
      const kind = covered(path) ? null : knownShapeOf(leaf)
      if (kind !== null) seen.set(`${path}:${kind}`, { path, kind })
    }
  return [...seen.values()]
}
