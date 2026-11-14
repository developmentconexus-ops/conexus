import type { ProposedCompanyMemory } from '@conexus/hub-api'
import { ASSISTANT_TOOL, CompanyMemoryPageId } from '@conexus/hub-api'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import type { CompanyMemory } from './company-memory.ts'
import type { ScopeOf } from './context.ts'

/** A note is one fact, as Mastra bounds it (about 250 tokens). */
const NOTE_MAX = 1000

const DESCRIPTION =
  "Proposes something for the company's memory, which the Assistant reads in every conversation of the company: a note on a page you read, or a new page. The conversation shows the text in a card, and nothing is saved until a person who may change the company's memory taps Salvar; you never save it. Propose what holds for the whole company, stays true and no query proves (a rule, an exception, a definition), never something about one person or one conversation; what a code or a field of a connected system means goes to concept_propose. A note takes `page`, the id knowledge_read gave the page, and `text`; a new page takes `name` and `text`, its body. Tell the person the card is there."

/**
 * `propose_company_memory` (alignment of the Assistant, U9, B1): the model proposes and a person
 * saves, as `propose_automation` does: the tool answers the proposal, which Mastra keeps with the
 * call and the screen draws with **Salvar**. A note's page is read in the conversation's company,
 * so the card names it; another company's page is not found.
 */
export function proposeCompanyMemoryTool(deps: { memory: CompanyMemory; scopeOf: ScopeOf }) {
  return createTool({
    id: ASSISTANT_TOOL.proposeCompanyMemory,
    description: DESCRIPTION,
    inputSchema: z
      .object({
        page: CompanyMemoryPageId.optional().describe(
          'For a note: the id of the page, from knowledge_read',
        ),
        name: z.string().trim().min(1).max(200).optional().describe('For a new page: its name'),
        text: z.string().trim().min(1).describe("The note's text, or the new page's body"),
      })
      .refine((input) => input.page !== undefined || input.name !== undefined, {
        message: 'A note takes `page`; a new page takes `name`.',
      })
      .refine((input) => input.page === undefined || input.text.length <= NOTE_MAX, {
        message: `A note holds at most ${NOTE_MAX} characters: propose a page instead.`,
      }),
    execute: async (input, { requestContext }): Promise<ProposedCompanyMemory> => {
      const scope = requestContext === undefined ? undefined : await deps.scopeOf(requestContext)
      // A tool runs inside a conversation's turn: none is a fault of ours.
      if (scope === undefined) {
        throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'PROPOSAL_OUTSIDE' } })
      }
      const { page, name, text } = input
      if (page !== undefined) {
        const read = await deps.memory.page(scope.companyId, page)
        return { kind: 'NOTE', pageId: page, pageName: read.name, body: text }
      }
      // The schema's refinement asks a page without `page` for its name.
      if (name === undefined) {
        throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'PROPOSAL_UNNAMED' } })
      }
      return { kind: 'PAGE', name, body: text }
    },
  })
}
