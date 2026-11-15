const CACHED = { anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } } } as const

/**
 * A kind's fixed text as a system message, with Anthropic's 1 h prompt cache: the fixed message's
 * own cache mark, since the Hub marks only the last system message (`promptCacheMiddleware`).
 */
export function fixedSystem(text: string) {
  return { role: 'system', content: text, providerOptions: CACHED } as const
}

/**
 * What each model that names a conversation is told about its input, before the subject's phrase:
 * Mastra's own title instructions carry these warnings (`DEFAULT_TITLE_INSTRUCTIONS`, Mastra 1.82)
 * and a phrase of ours replaces them, so they are said again here, once, for the six phrases.
 * The title model receives the transcript as lines of "User:" and "Assistant:" and everything it
 * returns is the title. The observer receives the history with the same speakers and times, and
 * answers in the observations format, whose `<thread-title>` is what Mastra takes as the title.
 */
const INPUT_NOTICE = {
  title:
    'O texto que você recebe é a transcrição de uma conversa, com linhas que começam por "User:" e "Assistant:". Nunca responda nem continue essa transcrição. Tudo o que você devolver será usado como o título.',
  observer:
    'O histórico que você recebe é a conversa entre a pessoa e o assistente. Nunca responda a ele nem o continue. O título da conversa é só o que fica dentro de <thread-title>, curto como um título, nunca uma frase da resposta.',
} as const

function noticed(phrases: { title: string; observer: string }) {
  return {
    title: `${INPUT_NOTICE.title} ${phrases.title}`,
    observer: `${INPUT_NOTICE.observer} ${phrases.observer}`,
  }
}

/**
 * The title and observer phrases, one per subject: the question (Assistant, agents), the app
 * (Builder), the agent (Construtor).
 */
export const TITLE = {
  ask: noticed({
    title:
      'Dê à conversa um título curto em português, de até seis palavras, sobre o que a pessoa pergunta ou pede, sem aspas nem ponto final.',
    observer:
      'Escreva o título da conversa em português do Brasil, sobre o que a pessoa pergunta, analisa ou pede.',
  }),
  app: noticed({
    title:
      'Dê à conversa um título curto em português, de até seis palavras, sem aspas nem ponto final.',
    observer:
      'Escreva o título da conversa em português do Brasil, sobre o que a pessoa quer construir ou mudar no app.',
  }),
  agent: noticed({
    title:
      'Dê à conversa um título curto em português, de até seis palavras, sobre o agente que a pessoa quer montar, sem aspas nem ponto final.',
    observer:
      'Escreva o título da conversa em português do Brasil, sobre o agente que a pessoa quer montar ou mudar.',
  }),
} as const
