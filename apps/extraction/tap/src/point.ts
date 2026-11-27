import type { TableColumnType } from '@conexus/connectors'

type Decimal = Readonly<{ units: bigint; places: number }>

const DECIMAL = /^(-?\d+)(?:\.(\d+))?$/

function decimalOf(text: string): Decimal {
  const [, whole, fraction = ''] = DECIMAL.exec(text) ?? []
  if (whole === undefined) throw new Error(`Not a number: ${text}`)
  return { units: BigInt(`${whole}${fraction}`), places: fraction.length }
}

function unitsAt({ units, places }: Decimal, scale: number): bigint {
  return units * 10n ** BigInt(scale - places)
}

function byNumber(left: string, right: string): number {
  const [a, b] = [decimalOf(left), decimalOf(right)]
  const scale = Math.max(a.places, b.places)
  const difference = unitsAt(a, scale) - unitsAt(b, scale)
  return difference === 0n ? 0 : difference < 0n ? -1 : 1
}

function byText(left: string, right: string): number {
  return left === right ? 0 : left < right ? -1 : 1
}

export function latest(
  values: readonly (string | null | undefined)[],
  type: TableColumnType,
): string | undefined {
  const order = type === 'numeric' || type === 'bigint' ? byNumber : byText
  return values
    .filter((value) => value != null)
    .sort(order)
    .at(-1)
}

export function behind(point: string, lag: number): string {
  const { units, places } = decimalOf(point)
  const moved = units - BigInt(lag) * 10n ** BigInt(places)
  if (places === 0) return String(moved)
  const digits = String(moved < 0n ? -moved : moved).padStart(places + 1, '0')
  return `${moved < 0n ? '-' : ''}${digits.slice(0, -places)}.${digits.slice(-places)}`
}
