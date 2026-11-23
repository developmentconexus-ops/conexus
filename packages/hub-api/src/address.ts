import { z } from 'zod'

// The address of a Projeto's app is one label below the apps' domain, `<name>--<nickname>`
// (decision 0024): the server stores it at birth and the screens show it as the person types,
// both from this one rule (code C26). A part never holds `--`, so the label reads one way. The
// Prévia's host is the same label and a third part, the mark, as Cloudflare names a Worker's previews.
const PART = /^[a-z0-9]+(-[a-z0-9]+)*$/
const SEPARATOR = '--'
/** The Prévia's mark, a third part after the app's label (decision 0024). */
const PREVIEW_MARK = 'previa'
const PREVIEW_SUFFIX = `${SEPARATOR}${PREVIEW_MARK}`
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

/** Where an app runs: the Hub's Prévia or the published app, whose host says which. */
export const AppEnvironment = z.enum(['preview', 'published'])
export type AppEnvironment = z.infer<typeof AppEnvironment>

/** The Prévia's host: the app's label and the mark. */
export const PreviewHost = z
  .string()
  .max(LABEL_MAX_LENGTH)
  .refine((host) => {
    const parts = host.split(SEPARATOR)
    return (
      parts.length === 3 && parts.at(-1) === PREVIEW_MARK && parts.every((part) => PART.test(part))
    )
  })
  .brand('PreviewHost')
export type PreviewHost = z.infer<typeof PreviewHost>

/** Any host the browser opens an app at: the published app's label or its Prévia's. */
export const AppHost = z.union([HostLabel, PreviewHost])
export type AppHost = z.infer<typeof AppHost>

/** The app a host opens and the environment it runs in there. */
export function appOfHost(host: AppHost): { label: HostLabel; environment: AppEnvironment } {
  const [name, nickname, mark] = host.split(SEPARATOR)
  const label = HostLabel.parse(`${name}${SEPARATOR}${nickname}`)
  return { label, environment: mark === undefined ? 'published' : 'preview' }
}

/** The Prévia's host of an app, or none when the label leaves no room for the mark. */
export function previewHostOf(label: HostLabel): PreviewHost | undefined {
  const host = PreviewHost.safeParse(`${label}${PREVIEW_SUFFIX}`)
  return host.success ? host.data : undefined
}

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
 * The label of a Projeto's app: its name cut to fit beside the nickname and the Prévia's mark, or
 * nothing when the name keeps fewer than three letters or digits.
 */
export function hostLabelOf(input: {
  name: string
  nickname: CompanyNickname
}): HostLabel | undefined {
  const room = LABEL_MAX_LENGTH - SEPARATOR.length - input.nickname.length - PREVIEW_SUFFIX.length
  const part = partOf(input.name, room)
  if (part.replaceAll('-', '').length < NAME_MIN_CHARACTERS) return undefined
  return HostLabel.parse(`${part}${SEPARATOR}${input.nickname}`)
}

/** An app's host name, published or the Prévia's, which the browser shows. */
export function appHostOf(input: { label: AppHost; appsDomain: string }): string {
  return `${input.label}.${input.appsDomain}`
}

/** An app a person uses: its Projeto's name, its company's and the address it opens at. */
export const AppEntry = z.object({
  projectName: z.string().min(1),
  companyName: z.string().min(1),
  address: z.string().min(1),
})
export type AppEntry = z.infer<typeof AppEntry>
