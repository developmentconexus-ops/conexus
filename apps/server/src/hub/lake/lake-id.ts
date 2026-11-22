import { randomInt } from 'node:crypto'
import { LakeId } from '../../platform/aws.ts'

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const LENGTH = 12

/**
 * A new lake id for each try, a failed one's included: AWS keeps a deleted bucket's name taken for
 * minutes (card L.4), and the id names the stack, the bucket and the token of the creation.
 */
export function newLakeId(): LakeId {
  return LakeId.parse(
    Array.from({ length: LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join(''),
  )
}
