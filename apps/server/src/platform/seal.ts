import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { Failure } from './failure.ts'
import { Secret } from './secret.ts'

const ALGORITHM = 'aes-256-gcm'
const KEY_BYTES = 32
const IV_BYTES = 12
const TAG_BYTES = 16
const KEY_LINE = /^([A-Za-z0-9_-]{1,64}):([A-Za-z0-9+/]+={0,2})$/

/**
 * The installation's keys (security S32, S33): the file's last line seals, every line opens, so a
 * retired key only opens until `reseal` has moved its rows to the current one.
 */
export type SealKeys = Readonly<{ sealingId: string; byId: ReadonlyMap<string, Buffer> }>

/** Parses the key file's text, one `id:base64` line per key of 32 bytes; anything else is refused. */
export function parseSealKeys(text: string): SealKeys {
  const byId = new Map<string, Buffer>()
  let sealingId: string | undefined
  for (const line of text.split('\n').map((each) => each.trim())) {
    if (line === '') continue
    const [, id, encoded] = KEY_LINE.exec(line) ?? []
    if (id === undefined || encoded === undefined) throw new TypeError('not an id:base64 line')
    const key = Buffer.from(encoded, 'base64')
    if (key.length !== KEY_BYTES || key.toString('base64') !== encoded)
      throw new TypeError('a key is not 32 bytes of base64')
    if (byId.has(id)) throw new TypeError('a key id repeats')
    byId.set(id, key)
    sealingId = id
  }
  if (sealingId === undefined) throw new TypeError('no key')
  return Object.freeze({ sealingId, byId })
}

/**
 * What a sealed value is bound to, as associated data: copied to another row, owner, kind or
 * provider, it no longer opens (S32). A sign-in's pending value has its own purpose.
 */
export type SealContext = {
  purpose: 'model-account' | 'model-account-sign-in'
  rowId: string
  companyId: string
  personId: string | null
  kind: string
  provider: string
}

export type Sealed = { keyId: string; blob: Uint8Array }

/** A credential opened inside the program: printed or serialized, it shows only its name (S41). */
export type Credential = Secret<'Credential'>

function associated(context: SealContext): Buffer {
  const { purpose, rowId, companyId, personId, kind, provider } = context
  return Buffer.from(JSON.stringify([purpose, rowId, companyId, personId, kind, provider]))
}

/** Seals with the current key; the blob is the IV, the tag, then the ciphertext. */
export function seal(keys: SealKeys, context: SealContext, plain: Credential): Sealed {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, keyOf(keys, keys.sealingId), iv)
  cipher.setAAD(associated(context))
  const body = Buffer.concat([cipher.update(plain.reveal(), 'utf8'), cipher.final()])
  return { keyId: keys.sealingId, blob: Buffer.concat([iv, cipher.getAuthTag(), body]) }
}

/** Opens what `seal` made for this same context, with whichever key sealed it. */
export function open(keys: SealKeys, context: SealContext, sealed: Sealed): Credential {
  const key = keyOf(keys, sealed.keyId)
  const blob = Buffer.from(sealed.blob)
  try {
    const iv = blob.subarray(0, IV_BYTES)
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES })
    decipher.setAAD(associated(context))
    decipher.setAuthTag(blob.subarray(IV_BYTES, IV_BYTES + TAG_BYTES))
    const body = blob.subarray(IV_BYTES + TAG_BYTES)
    const plain = Buffer.concat([decipher.update(body), decipher.final()])
    return new Secret('Credential', plain.toString('utf8'))
  } catch (cause) {
    throw new Failure('SEAL_REFUSED', { details: { keyId: sealed.keyId }, cause })
  }
}

function keyOf(keys: SealKeys, keyId: string): Buffer {
  const key = keys.byId.get(keyId)
  if (key === undefined)
    throw new Failure('SEAL_REFUSED', { details: { keyId, reason: 'unknown key' } })
  return key
}
