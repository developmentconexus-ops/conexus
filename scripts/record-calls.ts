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
export const RESEARCH_PROMPT = 'Quantos pedidos a Padaria Sol teve em outubro de 2026?'
export const RESEARCH_TYPE = 'pesquisar'
/** What the model does in the `research` scenarios: open the helper, the helper answers (or its call fails), then the main agent answers. */
export const RESEARCH_CALLS: Block[][] = [
  [
    {
      type: 'tool_use',
      name: 'subagent',
      input: {
        agentType: RESEARCH_TYPE,
        task: 'Quantos pedidos a Padaria Sol (Matriz) teve em outubro de 2026?',
      },
    },
  ],
  [{ type: 'text', text: 'A Matriz teve 120 pedidos em outubro de 2026.' }],
  [{ type: 'text', text: 'A Padaria Sol teve 120 pedidos em outubro de 2026.' }],
]
/** The `research-failed` scenario: the helper's call is refused, so the main agent answers without it. */
export const RESEARCH_FAILED_CALLS: Block[][] = [
  RESEARCH_CALLS[0] ?? [],
  [],
  [{ type: 'text', text: 'A pesquisa não deu; sigo sem ela.' }],
]
const HANDOFF_PROMPT = 'Monte um app de encomendas para uma padaria inventada.'
/** The signal the Assistant's handoff sends (`builder/assistant/handoff.ts`): the person's words, marked as the Assistant's. */
const HANDOFF_CONTENTS: { type: 'text'; text: string }[] = [
  { type: 'text', text: HANDOFF_PROMPT },
  {
    type: 'text',
    text: [
      'Arquivos que a pessoa mandou ao Assistente:',
      '- politica-comercial.pdf (PDF, 1,5 MB)',
      '- precos.xlsx (planilha, 48 KB)',
      'Eles ficam na conversa do Assistente; este Projeto não os tem. O que o briefing diz deles é o que o Assistente leu.',
    ].join('\n'),
  },
]
export const HANDOFF_SIGNAL = {
  type: 'user',
  tagName: 'user',
  contents: HANDOFF_CONTENTS,
  attributes: { source: 'assistant', assistantConversation: 'conversa-do-assistente' },
  author: { id: 'pessoa-inventada', name: 'Pessoa Inventada' },
} as const
/** What the model does in the `handoff` scenario: answer. */
export const HANDOFF_CALLS: Block[][] = [[{ type: 'text', text: 'Começando o app de encomendas.' }]]

export const APPROVAL_PROMPT =
  'Lance um pedido para o cliente 1, duas unidades do produto 11 a R$ 10.'
/** The person's words in `approval-interrupted`: they answer the card by writing instead of touching it. */
export const APPROVAL_STEER = 'Espera, são três unidades.'
/** The tool of the `approval` scenarios: a write that asks the person first, as the agents' controller runs it. */
export const APPROVAL_TOOL = 'tool_lancar_pedido'
const ORDER = {
  codigoCliente: 1,
  itens: [{ codigoProduto: 11, quantidade: 2, valorUnitario: 10 }],
}
const ASKED: Block = { type: 'tool_use', name: APPROVAL_TOOL, input: ORDER }
/** What the model does in the `approval` scenarios: call the write, then say what came of it. */
export const APPROVAL_CALLS = {
  approval: [[ASKED], [{ type: 'text', text: 'Lancei o pedido, a confirmar.' }]],
  'approval-declined': [[ASKED], [{ type: 'text', text: 'Não lancei o pedido.' }]],
  'approval-interrupted': [[ASKED], [{ type: 'text', text: 'Entendi, não lancei o pedido.' }]],
  'approval-stopped': [[ASKED]],
  'approval-refused': [[ASKED], [{ type: 'text', text: 'O Sankhya não aceitou o pedido.' }]],
} satisfies Record<string, Block[][]>

const PLAN_FILE = '.conexus/plans/encomendas.md'
export const PLAN_PROMPT = 'Planeje um app de encomendas para uma padaria inventada.'
export const STEER = 'Só eu cadastro.'
/** What the model does in the `plan` scenario: submit the plan, use a tool, and answer once the person's steer is in. */
export const PLAN_CALLS: Block[][] = [
  [{ type: 'tool_use', name: 'submit_plan', input: { path: PLAN_FILE } }],
  [{ type: 'tool_use', name: 'anotar', input: { nota: 'Plano aprovado, começando.' } }],
  [{ type: 'text', text: 'Pronto, o cadastro será só seu.' }],
]

export const FILES_PROMPT =
  'Leia os arquivos e diga, em uma frase, o que a padaria inventada precisa.'
export const MORE_FILES_PROMPT = 'Este PDF também vale.'
/** Invented and tiny (security S40): a markdown note, a PDF and a 1×1 PNG, as the browser reads them. */
const MARKDOWN = '# Observações\n\nSem glúten.\n'
const PDF = '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
function dataUrl(mediaType: string, base64: string): string {
  return `data:${mediaType};base64,${base64}`
}
function text64(text: string): string {
  return Buffer.from(text).toString('base64')
}
export const FILES = [
  {
    filename: 'observacoes.md',
    mediaType: 'text/markdown',
    data: dataUrl('text/markdown', text64(MARKDOWN)),
  },
  {
    filename: 'precos.pdf',
    mediaType: 'application/pdf',
    data: dataUrl('application/pdf', text64(PDF)),
  },
  { filename: 'logo.png', mediaType: 'image/png', data: dataUrl('image/png', PNG) },
]
export const MORE_FILE = {
  filename: 'cardapio.pdf',
  mediaType: 'application/pdf',
  data: dataUrl('application/pdf', text64(PDF)),
}
/** What the model does in the `files` scenario: use its tool, and answer once the second message is in. */
export const FILES_CALLS: Block[][] = [
  [{ type: 'tool_use', name: 'anotar', input: { nota: 'Arquivos lidos.' } }],
  [{ type: 'text', text: 'Ela precisa de pães sem glúten.' }],
]
