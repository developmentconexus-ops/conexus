import { createHash } from 'node:crypto'

/**
 * A UUID (version 8, RFC 9562) derived from its parts, so a repeated attempt, or the same ready read
 * chosen twice, finds the same row (code C37).
 */
export function derivedUuid(...parts: readonly string[]): string {
  const bytes = createHash('sha256').update(parts.join('\u0000')).digest().subarray(0, 16)
  bytes.writeUInt8((bytes.readUInt8(6) & 0x0f) | 0x80, 6)
  bytes.writeUInt8((bytes.readUInt8(8) & 0x3f) | 0x80, 8)
  return bytes.toString('hex').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
}
