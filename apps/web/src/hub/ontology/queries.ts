import type { CompanyId } from '@conexus/hub-api'
import {
  ConceptKey,
  decideOntologyProposal,
  getOntology,
  getOntologyConcept,
  listOntologyProposals,
  listOntologyRevisions,
  suggestConcepts,
} from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

/** What Conhecimento opens on: the concepts, the revision, and whether the person decides. */
export function ontologyQuery(companyId: CompanyId) {
  return hubQuery(getOntology, { params: { companyId } })
}

/** One concept's page; the address's key is a plain string the route already checked. */
export function conceptQuery(companyId: CompanyId, concept: string) {
  return hubQuery(getOntologyConcept, { params: { companyId, concept: ConceptKey.parse(concept) } })
}

/** The proposals still waiting for a decision, with the item and what it changes. */
export function openProposalsQuery(companyId: CompanyId) {
  return hubQuery(listOntologyProposals, { params: { companyId }, query: { state: 'OPEN' } })
}

export function revisionsQuery(companyId: CompanyId) {
  return hubQuery(listOntologyRevisions, { params: { companyId } })
}

export const sendSuggestion = hubMutation(suggestConcepts)
export const sendDecision = hubMutation(decideOntologyProposal)
