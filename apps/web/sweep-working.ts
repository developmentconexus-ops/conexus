import { readConversation } from '@conexus/hub-api'
import { ok } from './layout-harness.ts'
import {
  EDIT_DONE,
  READ_DONE,
  WRITE_DONE,
  WRITE_REFUSED_STORED,
} from './src/builder/conversation/tool-fixtures.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { PROJECT_ID } from './sweep-replies.ts'
import type { Said } from './sweep-session.ts'
import { parkedOf, sessionReplies, storedOf } from './sweep-session.ts'

const API = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations`
export const WORKING = '33333333-3333-4333-8333-333333333333'
export const PLANNING = '44444444-4444-4444-8444-444444444444'
const STARTED = '2026-10-19T12:00:00.000Z'

const BASE = {
  title: 'Encomendas',
  createdAt: STARTED,
  model: 'anthropic/claude-sonnet-4',
  effort: 'off',
  tasks: [],
} as const

const PERSON_SAID: Said = {
  id: 'm1',
  role: 'person',
  parts: [{ type: 'text', text: 'Monte a tela de encomendas' }],
  createdAt: '2026-10-19T12:00:00.000Z',
}

const QUESTION = {
  questions: [
    {
      question: 'Quem cadastra as encomendas?',
      options: [{ label: 'Todos (recomendado)' }, { label: 'Só eu' }],
      multiSelect: false,
    },
  ],
}

const PLAN = {
  title: 'App de encomendas',
  plan: '## Para a pessoa\n\nUma tela de encomendas com cliente, data e valor.',
}

/** What the Builder is doing at 390px: edits, a write, a refusal, a group of reads and a question. */
const BUILDER_WORKING: Said = {
  id: 'm2',
  role: 'builder',
  parts: [
    { type: 'tool-invocation', toolInvocation: EDIT_DONE },
    { type: 'tool-invocation', toolInvocation: WRITE_DONE },
    { type: 'text', text: 'Agora tento escrever fora da pasta do app.' },
    { type: 'tool-invocation', toolInvocation: WRITE_REFUSED_STORED },
    { type: 'text', text: 'Releio os arquivos.' },
    ...['a', 'b', 'c'].map((suffix) => ({
      type: 'tool-invocation' as const,
      toolInvocation: { ...READ_DONE, toolCallId: `toolu_read_${suffix}` },
    })),
    {
      type: 'tool-invocation',
      toolInvocation: {
        state: 'call',
        toolCallId: 'toolu_ask',
        toolName: 'ask_user',
        args: QUESTION,
      },
    },
  ],
  model: 'anthropic/claude-sonnet-4',
  createdAt: '2026-10-19T12:01:00.000Z',
}

const TASKS = [
  { id: '1', content: 'Montar a tabela', activeForm: 'Montando a tabela', status: 'completed' },
  {
    id: '2',
    content: 'Fazer a tela de encomendas',
    activeForm: 'Montando a tela de encomendas com cliente, data e valor',
    status: 'in_progress',
  },
  { id: '3', content: 'Conferir o app', activeForm: 'Conferindo o app', status: 'pending' },
  { id: '4', content: 'Testar no celular', activeForm: 'Testando no celular', status: 'pending' },
  { id: '5', content: 'Publicar', activeForm: 'Publicando', status: 'pending' },
] as const

const READ_WORKING = readConversation.success.body.parse({
  conversation: { ...BASE, id: WORKING },
})

const PLAN_SAID: Said = {
  id: 'm2',
  role: 'builder',
  parts: [
    {
      type: 'tool-invocation',
      toolInvocation: {
        state: 'call',
        toolCallId: 'toolu_plan',
        toolName: 'submit_plan',
        args: PLAN,
      },
    },
  ],
  model: 'anthropic/claude-sonnet-4',
  createdAt: '2026-10-19T12:01:00.000Z',
}

const READ_PLANNING = readConversation.success.body.parse({
  conversation: { ...BASE, id: PLANNING },
})

/**
 * The answer in progress, as the stream tells it to a screen that opens mid-run: the run going with
 * the question waiting, the step as it stands, then the tasks.
 */
export const WORKING_REPLIES = {
  [`GET ${API}/${WORKING}`]: ok(readConversation, READ_WORKING),
  ...sessionReplies(WORKING, {
    messages: [PERSON_SAID],
    display: {
      isRunning: true,
      pendingSuspensions: parkedOf({
        toolCallId: 'toolu_ask',
        toolName: 'ask_user',
        args: QUESTION,
      }),
    },
    events: [
      { type: 'message_start', message: storedOf(BUILDER_WORKING) },
      { type: 'task_updated', tasks: TASKS },
    ],
  }),
}

export const PLANNING_REPLIES = {
  [`GET ${API}/${PLANNING}`]: ok(readConversation, READ_PLANNING),
  ...sessionReplies(PLANNING, {
    messages: [PERSON_SAID, PLAN_SAID],
    display: {
      pendingSuspensions: parkedOf({
        toolCallId: 'toolu_plan',
        toolName: 'submit_plan',
        args: PLAN,
      }),
    },
  }),
}
