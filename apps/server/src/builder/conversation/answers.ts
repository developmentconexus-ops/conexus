import type { QuestionAnswer, ToolCallId } from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import type { Card } from './cards.ts'
import { claimCard, openCards } from './cards.ts'
import type { Live } from './live.ts'

/** What the tool resumes with for an answer, or the refusal of an answer that does not fit the card. */
function resumeOf(card: Card, body: QuestionAnswer): unknown {
  if (card.type === 'plan') {
    if (body.kind !== 'plan') throw new Failure('QUESTION_ANSWERS_INVALID')
    const { action, feedback } = body
    return { action, feedback, title: card.title, plan: card.plan }
  }
  if (body.kind !== 'answers' || body.answers.length !== card.questions.length) {
    throw new Failure('QUESTION_ANSWERS_INVALID')
  }
  const fits = card.questions.every((question, index) =>
    Array.isArray(body.answers[index]) ? question.multiSelect : true,
  )
  if (!fits) throw new Failure('QUESTION_ANSWERS_INVALID')
  return body.answers
}

/**
 * The person's answer to a card: the answers to its questions, or the decision on its plan, checked
 * against the card, then Mastra's claim on the call, taken at once, as Mastra's own route does
 * (`agent-controller.ts`, the tool-suspension route), so a second answer is `QUESTION_CLOSED`. The
 * claim is held until `releaseCards`.
 */
export function claimAnswer(live: Live, input: { toolCallId: ToolCallId; body: QuestionAnswer }) {
  const { toolCallId, body } = input
  const card = openCards(live).find((each) => each.toolCallId === toolCallId)
  if (card === undefined) throw new Failure('QUESTION_CLOSED')
  const resumeData = resumeOf(card, body)
  const claim = claimCard(live, toolCallId)
  if (!claim.accepted) throw new Failure('QUESTION_CLOSED')
  return { address: claim.address, resumeData }
}
