import type { Block } from '../apps/server/src/platform/test-anthropic-stream.ts'

// What the model does in the `tasks`, `reads` and `handoff` scenarios of `scripts/record.ts`: invented prompts and calls (security S40).
export const TASKS_PROMPT = 'Monte um app de encomendas para uma padaria inventada, por tarefas.'
const PLANNED = [
  { id: '1', content: 'Montar a tabela', activeForm: 'Montando a tabela', status: 'in_progress' },
  { id: '2', content: 'Fazer a tela', activeForm: 'Fazendo a tela', status: 'pending' },
  { id: '3', content: 'Conferir o app', activeForm: 'Conferindo o app', status: 'pending' },
]
/** What the model does in the `tasks` scenario: plan three tasks, complete two, one call each, and answer. */
export const TASKS_CALLS: Block[][] = [
  [{ type: 'tool_use', name: 'task_write', input: { tasks: PLANNED } }],
  [{ type: 'tool_use', name: 'task_complete', input: { id: '1' } }],
  [{ type: 'tool_use', name: 'task_complete', input: { id: '2' } }],
  [{ type: 'text', text: 'Falta conferir o app.' }],
]

export const READS_PROMPT = 'Quanto a Padaria Sol vendeu em setembro de 2026 por vendedor?'
const SOLD_BY_SELLER =
  "SELECT V.APELIDO, ROUND(SUM(I.VLRTOT), 2) AS TOTAL FROM TGFCAB C JOIN TGFITE I ON I.NUNOTA = C.NUNOTA JOIN TGFVEN V ON V.CODVEND = C.CODVEND WHERE C.DTNEG BETWEEN '2026-09-01' AND '2026-09-30' GROUP BY V.APELIDO ORDER BY TOTAL DESC"
/** What the model does in the `reads` scenario: read the Matriz by seller, then answer with what it read. */
export const READS_CALLS: Block[][] = [
  [
    {
      type: 'tool_use',
      name: 'connector_read',
      input: {
        connection: 'Matriz',
        operation: 'sankhya.consultar',
        input: { sql: SOLD_BY_SELLER },
      },
    },
  ],
  [
    {
      type: 'text',
      text: 'Em setembro de 2026, na Matriz: JOAO vendeu R$ 8.072,70, RITA R$ 7.951,50 e MARCIA R$ 7.726,50.',
    },
  ],
]
const HANDOFF_PROMPT = 'Monte um app de encomendas para uma padaria inventada.'
/** The signal the Assistant's handoff sends (`builder/assistant/handoff.ts`): the person's words, marked as the Assistant's. */
export const HANDOFF_SIGNAL = {
  type: 'user',
  tagName: 'user',
  contents: HANDOFF_PROMPT,
  attributes: { source: 'assistant', assistantConversation: 'conversa-do-assistente' },
  author: { id: 'pessoa-inventada', name: 'Pessoa Inventada' },
} as const
/** What the model does in the `handoff` scenario: answer. */
export const HANDOFF_CALLS: Block[][] = [[{ type: 'text', text: 'Começando o app de encomendas.' }]]
