import { formatCnpj } from '@brazilian-utils/brazilian-utils'

/** A stored CNPJ with its mask, letters included: "12.ABC.345/01DE-35". */
export function maskedCnpj(cnpj: string): string {
  return formatCnpj(cnpj, { version: 2 })
}
