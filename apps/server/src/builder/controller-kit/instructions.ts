const CACHED = { anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } } } as const

/**
 * A kind's fixed text as a system message, with Anthropic's 1 h prompt cache: the fixed message's
 * own cache mark, since the Hub marks only the last system message (`promptCacheMiddleware`).
 */
export function fixedSystem(text: string) {
  return Object.freeze({ role: 'system', content: text, providerOptions: CACHED } as const)
}

/**
 * The title and observer phrases, one per subject: the question (Assistant, agents), the app
 * (Builder), the agent (Construtor).
 */
export const TITLE = Object.freeze({
  ask: {
    title:
      'Dê à conversa um título curto em português, de até seis palavras, sobre o que a pessoa pergunta ou pede, sem aspas nem ponto final.',
    observer:
      'Escreva o título da conversa em português do Brasil, sobre o que a pessoa pergunta, analisa ou pede.',
  },
  app: {
    title:
      'Dê à conversa um título curto em português, de até seis palavras, sem aspas nem ponto final.',
    observer:
      'Escreva o título da conversa em português do Brasil, sobre o que a pessoa quer construir ou mudar no app.',
  },
  agent: {
    title:
      'Dê à conversa um título curto em português, de até seis palavras, sobre o agente que a pessoa quer montar, sem aspas nem ponto final.',
    observer:
      'Escreva o título da conversa em português do Brasil, sobre o agente que a pessoa quer montar ou mudar.',
  },
} as const)
