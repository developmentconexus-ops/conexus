import type { MastraMessagePart } from '@mastra/client-js'

/**
 * Tool calls as the Hub says them, with Mastra 1.78.0's own arguments and results.
 *
 * The write, edit and read results were captured by calling `createWorkspaceTools` on a
 * `LocalFilesystem` workspace with `{path: 'src/a.ts', content: 'export const a = 1\n'}`, then
 * `{old_string: 'a = 1', new_string: 'a = 2'}`. The read is the one taken before the edit.
 * The failed write is the stored and the live part of the Builder's write outside the app folder
 * (`conversation-machine.test.ts`), and the denied question the stored part of an expired one
 * (`conversation-waiting.test.ts`).
 */
export type Invocation = Extract<MastraMessagePart, { type: 'tool-invocation' }>['toolInvocation']

const WRITE_ARGS = { path: 'src/a.ts', content: 'export const a = 1\n' }
const EDIT_ARGS = { path: 'src/a.ts', old_string: 'a = 1', new_string: 'a = 2' }
const OUTSIDE = { path: '../fora.ts', content: 'x\n' }
const REFUSAL = 'Permission denied: stat on ../fora.ts'
const QUESTION_ARGS = {
  questions: [
    {
      question: 'Quem cadastra as encomendas?',
      options: [{ label: 'Todos (recomendado)' }, { label: 'Só eu' }],
    },
  ],
}

export const READ_DONE: Invocation = {
  state: 'result',
  toolCallId: 'toolu_read_1',
  toolName: 'mastra_workspace_read_file',
  args: { path: 'src/a.ts' },
  result: 'src/a.ts (19 bytes)\n     1→export const a = 1\n     2→',
}

export const WRITE_DONE: Invocation = {
  state: 'result',
  toolCallId: 'toolu_write_1',
  toolName: 'mastra_workspace_write_file',
  args: WRITE_ARGS,
  result: 'Wrote 19 bytes to src/a.ts',
}

export const EDIT_DONE: Invocation = {
  state: 'result',
  toolCallId: 'toolu_edit_1',
  toolName: 'mastra_workspace_edit_file',
  args: EDIT_ARGS,
  result: 'Replaced 1 occurrence in src/a.ts (lines 1)',
}

/** The refused write as Mastra's store keeps it: `output-error`, the reason in `errorText`. */
export const WRITE_REFUSED_STORED: Invocation = {
  state: 'output-error',
  toolCallId: 'toolu_refused_1',
  toolName: 'mastra_workspace_write_file',
  args: OUTSIDE,
  errorText: REFUSAL,
}

/** The same refusal as the stream says it: a `result` that is an error. */
export const WRITE_REFUSED_LIVE: Invocation = {
  state: 'result',
  toolCallId: 'toolu_refused_1',
  toolName: 'mastra_workspace_write_file',
  args: OUTSIDE,
  result: REFUSAL,
  isError: true,
}

/** An edit refused the same way: the same error shape, an edit's arguments. */
export const EDIT_REFUSED_STORED: Invocation = {
  state: 'output-error',
  toolCallId: 'toolu_refused_2',
  toolName: 'mastra_workspace_edit_file',
  args: { path: '../fora.ts', old_string: 'a', new_string: 'b' },
  errorText: REFUSAL,
}

/** The question Mastra closed denied when its wait ran out, as the store keeps it. */
export const QUESTION_DENIED: Invocation = {
  state: 'output-denied',
  toolCallId: 'toolu_denied_1',
  toolName: 'ask_user',
  args: QUESTION_ARGS,
}

/** The same question asking and closed, as the parts of one step. */
export const QUESTION_ASKING: MastraMessagePart = {
  type: 'tool-invocation',
  toolInvocation: { ...QUESTION_DENIED, state: 'call' },
}
export const QUESTION_CLOSED_PART: MastraMessagePart = {
  type: 'tool-invocation',
  toolInvocation: QUESTION_DENIED,
}

/** A plan closed the same way: the same state, `submit_plan`'s arguments. */
export const PLAN_DENIED: Invocation = {
  state: 'output-denied',
  toolCallId: 'toolu_denied_2',
  toolName: 'submit_plan',
  args: { title: 'App de encomendas', plan: 'Uma tela de encomendas.' },
}
