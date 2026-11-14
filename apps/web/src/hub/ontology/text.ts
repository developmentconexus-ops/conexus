import type { ConceptRow, ConceptView, FieldView, ProposalItemView } from '@conexus/hub-api'
import { dayAndHour } from '../../platform/dates.ts'
import { unconfirmedText } from '../../platform/hub.ts'

/** The words of the Conhecimento screens (A Ontologia da empresa, U4); the founder approves them at the step's end. */
export const KNOWLEDGE_TITLE = 'Conhecimento'
export const HALF_TITLE = 'Como a empresa é'
export const NO_CONCEPTS =
  'Nenhum conceito aprovado ainda. O Builder propõe conceitos quando você pede um app.'
export const NO_FLOW = 'Nenhum fluxo ainda.'
export const NO_FLOW_MORE =
  'Os estados, as passagens e o que move cada uma entram com a etapa O fluxo da empresa.'
export const NOTHING_TO_REVIEW = 'Nada para revisar.'
export const NO_REVISIONS = 'Nenhuma revisão ainda.'
export const AWAITS = {
  OWNER: 'Aguarda o dono.',
  APPROVER: 'Aguarda quem cuida dos conceitos.',
} as const
export const CONCEPT_GONE = 'Este conceito não existe.'
export const BACK_TO_CONCEPTS = 'Voltar aos conceitos'
export const CODE_GONE = 'Este código não existe mais.'
export const BACK_TO_CONCEPT = 'Voltar ao conceito'
export const PROPOSAL_DECIDED = 'Esta proposta já foi decidida.'
export const TO_HISTORY = 'Ver o histórico'
export const SEE_AGAIN = 'Ver de novo'
export const SUGGEST = 'Sugerir mudança'
export const SEE_AND_SUGGEST = 'Ver e sugerir'
export const NOTHING_TO_PROPOSE = 'Nada a propor: o Builder explica na conversa.'
export const REVIEW_AND_APPROVE = 'Revisar e aprovar'
export const UNCONFIRMED_SUGGESTION = unconfirmedText('a sugestão', 'Toque de novo.')
export const UNCONFIRMED_DECISION = unconfirmedText('a decisão', 'Veja de novo.')

export const TAB_LABEL = {
  conceitos: 'Conceitos',
  revisar: 'Para revisar',
  historico: 'Histórico',
} as const

const FIELD_TYPE = {
  ID: 'código',
  TEXT: 'texto',
  INTEGER: 'número inteiro',
  DECIMAL: 'número',
  MONEY: 'dinheiro',
  DATE: 'data',
  TIMESTAMP: 'data e hora',
  BOOLEAN: 'sim ou não',
  CODE: 'lista',
} as const satisfies Record<FieldView['type'], string>

/** A field's type in words; money names its currency's symbol when it is the real. */
export function fieldTypeText(field: Pick<FieldView, 'type' | 'currency'>): string {
  const type = FIELD_TYPE[field.type]
  return field.currency === 'BRL' ? `${type} (R$)` : type
}

export function plural(count: number, one: string, many: string): string {
  return `${count.toLocaleString('pt-BR')} ${count === 1 ? one : many}`
}

/** The word that says what a concept is, beside its name: a role of another concept. */
export function isText(
  concept: Pick<ConceptView, 'base'>,
  concepts: readonly ConceptRow[],
): string {
  if (concept.base === null) return '—'
  const base = concepts.find((each) => each.key === concept.base)
  return `papel de ${base?.name ?? concept.base}`
}

export function stateText(state: ConceptView['state']): string {
  if (state === 'DEPRECATED') return 'aposentado'
  return state === 'EXPERIMENTAL' ? 'em teste' : 'ativo'
}

/** The line of one item of a proposal: what it adds or changes, in the person's words. */
export function itemText(item: ProposalItemView['item']): string {
  switch (item.kind) {
    case 'ADD_CONCEPT':
      return item.concept.base === undefined
        ? item.concept.name
        : `${item.concept.name} · papel de ${item.concept.base}`
    case 'ADD_FIELD':
      return `${item.concept} · ${item.field.name}`
    case 'SET_CODE':
      return `${item.concept}.${item.field} · ${item.value} ${item.label}`
    case 'ADD_RELATION':
      return `${item.relation.fromName} · ${item.relation.toName}`
    case 'SET_SOURCE':
      return `${item.concept} · de onde lê`
    case 'RENAME_LABEL':
      return `${item.target} · ${item.name}`
    case 'DEPRECATE':
      return item.replacedBy === undefined
        ? `${item.target} · aposentar`
        : `${item.target} · aposentar, use ${item.replacedBy}`
    default:
      return item satisfies never
  }
}

export function when(instant: string): string {
  return dayAndHour(instant)
}
