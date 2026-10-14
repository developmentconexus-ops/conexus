import { readFileSync, statSync } from 'node:fs'
import { Failure } from './failure.ts'

const OTHERS_MASK = 0o077

export function readSecretFile(variable: string, path: string): string {
  try {
    if (statSync(path).mode & OTHERS_MASK) throw new Error('readable by others')
    const value = readFileSync(path, 'utf8').trim()
    if (value === '') throw new Error('empty')
    return value
  } catch (cause) {
    throw new Failure('CONFIG_INVALID', { details: { variables: variable }, cause })
  }
}
