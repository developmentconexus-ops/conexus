import type { PostgresStore } from '@mastra/pg'
import { conversationMemory } from '../conversation/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'

const TITLE_INSTRUCTIONS =
  'Dê à conversa um título curto em português, de até seis palavras, sobre o que a pessoa pergunta ou pede, sem aspas nem ponto final.'
const OBSERVER_INSTRUCTION =
  'Escreva o título da conversa em português do Brasil, sobre o que a pessoa pergunta, analisa ou pede.'

/** The Assistant's memory: the Builder's shape (`conversationMemory`), with its title and observer written for a conversation. */
export function assistantMemory(deps: { storage: PostgresStore; queue: QueueDeps }) {
  return conversationMemory({ ...deps, title: TITLE_INSTRUCTIONS, observer: OBSERVER_INSTRUCTION })
}
