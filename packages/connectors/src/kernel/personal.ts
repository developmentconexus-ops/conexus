/** The kinds of personal data a connector's read may carry, fixed for every connector (step "a política de dados pessoais"). */
export const PERSONAL_KINDS = ['contato', 'endereco', 'documento', 'sensivel'] as const
export type PersonalKind = (typeof PERSONAL_KINDS)[number]
