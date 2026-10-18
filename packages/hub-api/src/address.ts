import { z } from 'zod'

// The address of a Projeto's app is one label below the apps' domain, `<name>--<nickname>`
// (decision 0024): the server stores it at birth and the screens show it as the person types,
// both from this one rule (code C26). A part never holds `--`, so the label reads one way.
const PART = /^[a-z0-9]+(-[a-z0-9]+)*$/
const SEPARATOR = '--'
/** The longest label a host name takes (RFC 1035). */
const LABEL_MAX_LENGTH = 63
/** The fewest letters or digits a Projeto's part keeps, so no label starts like `ab--`, an IDNA form. */
const NAME_MIN_CHARACTERS = 3

export const NICKNAME_MIN_LENGTH = 3
export const NICKNAME_MAX_LENGTH = 30

/** Names a nickname may not take: the Conexus's own hosts and words (founder, 2026-10-17, "A"). */
export const RESERVED_NICKNAMES: readonly string[] = [
  'www',
  'hub',
  'api',
  'app',
  'apps',
  'admin',
  'central',
  'conexus',
  'suporte',
  'mail',
  'preview',
]

export const CompanyNickname = z
  .string()
  .min(NICKNAME_MIN_LENGTH)
  .max(NICKNAME_MAX_LENGTH)
  .regex(PART)
  .brand('CompanyNickname')
export type CompanyNickname = z.infer<typeof CompanyNickname>

export const HostLabel = z
  .string()
  .max(LABEL_MAX_LENGTH)
  .refine((label) => {
    const parts = label.split(SEPARATOR)
    return parts.length === 2 && parts.every((part) => PART.test(part))
  })
  .brand('HostLabel')
export type HostLabel = z.infer<typeof HostLabel>

/** Without accents, in lowercase, each run of anything but a letter or a digit one `-`. */
function partOf(text: string, maxLength: number): string {
  return text
    .normalize('NFD')
    .replaceAll(/\p{M}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .slice(0, maxLength)
    .replaceAll(/^-+|-+$/g, '')
}

export function isReservedNickname(nickname: CompanyNickname): boolean {
  return RESERVED_NICKNAMES.includes(nickname)
}

/** The nickname the setup suggests from the company's name, or none when too little is left. */
export function suggestedNickname(companyName: string): string {
  const part = partOf(companyName, NICKNAME_MAX_LENGTH)
  return part.length >= NICKNAME_MIN_LENGTH ? part : ''
}

/**
 * The label of a Projeto's app: its name cut to fit beside the nickname, or nothing when the name
 * keeps fewer than three letters or digits.
 */
export function hostLabelOf(input: {
  name: string
  nickname: CompanyNickname
}): HostLabel | undefined {
  const room = LABEL_MAX_LENGTH - SEPARATOR.length - input.nickname.length
  const part = partOf(input.name, room)
  if (part.replaceAll('-', '').length < NAME_MIN_CHARACTERS) return undefined
  return HostLabel.parse(`${part}${SEPARATOR}${input.nickname}`)
}

/** The app's host name, which the browser shows. */
export function appHostOf(input: { label: HostLabel; appsDomain: string }): string {
  return `${input.label}.${input.appsDomain}`
}
