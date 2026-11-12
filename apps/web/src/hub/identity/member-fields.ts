import type { Member } from '@conexus/hub-api'
import { MEMBER_PROFILE_MAX } from '@conexus/hub-api'
import { z } from 'zod'

/** The sentence under a field that holds more than the Hub keeps. */
export const TOO_LONG = `Escreva até ${MEMBER_PROFILE_MAX} caracteres.`

// A blank field is nothing written: the Hub keeps `null`, not an empty text.
const Written = z
  .string()
  .trim()
  .max(MEMBER_PROFILE_MAX)
  .transform((text) => (text === '' ? null : text))

/** The two fields as the person types them, and as the Hub's body takes them. */
export const ProfileFields = z.object({ jobTitle: Written, department: Written })

/** What the fields hold for a member: their texts, or empty for what they never wrote. */
export function fieldsOf(member: Pick<Member, 'jobTitle' | 'department'> | undefined) {
  return { jobTitle: member?.jobTitle ?? '', department: member?.department ?? '' }
}

/** The member's two texts on one line, "Cargo · Área", or none when they wrote neither. */
export function profileLine(member: Pick<Member, 'jobTitle' | 'department'>): string | undefined {
  const line = [member.jobTitle, member.department].filter((text) => text !== null).join(' · ')
  return line === '' ? undefined : line
}
