import { BASE, OfConversation, READ_FAILURES } from './conversations.ts'
import type { FailureCode } from './failures.ts'
import { defineOperation } from './operation.ts'
import { QuestionAnswer, ToolCallId } from './questions.ts'

export const answerQuestion = defineOperation({
  id: 'answerQuestion',
  summary:
    'Answers the card a turn waits on: the answers to its questions, or the decision on its plan.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/{conversationId}/questions/{toolCallId}`,
  bodyLimit: 128 * 1024,
  input: { params: OfConversation.extend({ toolCallId: ToolCallId }), body: QuestionAnswer },
  success: { status: 202 },
  failures: [...READ_FAILURES, 'QUESTION_CLOSED', 'QUESTION_ANSWERS_INVALID'],
})
