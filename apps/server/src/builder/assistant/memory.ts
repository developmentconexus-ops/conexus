import type { MastraCompositeStore } from '@mastra/core/storage'
import { conversationMemory, TITLE } from '../controller-kit/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import { OBSERVED } from './files.ts'
import { ASSISTANT_OBSERVER } from './instructions.ts'

/**
 * The person's working memory as the model first sees it and the person reads it: four headings in
 * Portuguese (Claude Code's four kinds of note) and nothing else. The rules of what to keep, the
 * dated lines and the 4,000 characters live in the Assistant's instructions (`prompt/assistant.md`),
 * where the person cannot erase them.
 */
export const PROFILE_TEMPLATE = `# Sobre você
# Correções que você deu
# No que você está trabalhando
# Onde achar as coisas`

/**
 * The template a note was born from before the headings were Portuguese: a note kept with it stays
 * readable, and one never written still reads as nothing kept.
 */
export const LEGACY_PROFILE_TEMPLATE = `# About the person
<!-- role, area, what they follow; only what they said or showed -->
# Corrections they gave
<!-- how they want answers: format, terms, what was wrong before -->
# Work in progress
<!-- what they are following now, with the period -->
# Where to find things
<!-- which connection, read or file holds what they ask often -->
<!-- Rules: never keep what a read of the company's systems gives again (values, lists, totals);
end each line you add with its date (YYYY-MM-DD); keep this note under 4,000 characters, shortening
the oldest lines first. -->`

/**
 * The Assistant's memory: the Builder's shape (`conversationMemory`), with its title and observer
 * written for a conversation, the recall of every conversation of the same person in the company
 * (its resource), and that person's working memory.
 */
export function assistantMemory(deps: { storage: MastraCompositeStore; queue: QueueDeps }) {
  return conversationMemory({
    ...deps,
    ...TITLE.ask,
    observer: ASSISTANT_OBSERVER,
    recall: 'resource',
    workingMemory: { enabled: true, scope: 'resource', template: PROFILE_TEMPLATE },
    observeAttachments: OBSERVED,
  })
}
