import type { SealContext, SealKeys } from './seal.ts'
import { Credential, open, seal } from './seal.ts'

/** The seal for tests of the model accounts: a credential, a sealed blob and its text back. */
export function testCredential(text: string): Credential {
  return Credential.parse(text)
}

export function testSealed(keys: SealKeys, context: SealContext, text: string) {
  const sealed = seal(keys, context, Credential.parse(text))
  return { keyId: sealed.keyId, blob: Buffer.from(sealed.blob) }
}

export function testOpened(
  keys: SealKeys,
  context: SealContext,
  sealed: { keyId: string; blob: Uint8Array },
): string {
  return open(keys, context, sealed).reveal()
}
