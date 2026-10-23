import type { QuestionAnswer, ToolCallId } from '@conexus/hub-api'
import { Failure, logFailure } from '../../platform/failure.ts'
import { openCards, resumed, tellCard, waitOn } from './cards.ts'
import type { Card, Live } from './live.ts'

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
 * The card once answered: its questions with the answers the tool resumes with, which its result
 * keeps for a later read (`parts.ts`); its plan approved or rejected.
 */
function answeredCard(card: Card, body: QuestionAnswer): Card {
  if (card.type === 'question') {
    return body.kind === 'answers'
      ? { ...card, state: 'answered', answers: body.answers }
      : { ...card, state: 'closed' }
  }
  return { ...card, state: body.kind === 'plan' ? body.action : 'closed' }
}

/**
 * The person's answer to the card the turn waits on: the answers to its questions, or the decision
 * on its plan. Mastra's claim takes the call at once, so a second answer is `QUESTION_CLOSED`, and
 * the resume starts in the same instant, as Mastra's own route does (`agent-controller.ts`, the
 * tool-suspension route): a Parar, an expiry or a message that comes after it closes the call
 * through Mastra, which ends the turn once (`cards.ts`). The answer is over once Mastra took the
 * call, or refused it and keeps the card open.
 */
export async function answerCard(
  live: Live,
  input: { toolCallId: ToolCallId; body: QuestionAnswer },
): Promise<void> {
  const { toolCallId, body } = input
  const card = openCards(live).find((each) => each.toolCallId === toolCallId)
  if (card === undefined) throw new Failure('QUESTION_CLOSED')
  const resumeData = resumeOf(card, body)
  const claim = live.session.claimToolSuspension(toolCallId)
  if (!claim.accepted) throw new Failure('QUESTION_CLOSED')
  tellCard(live, answeredCard(card, body))
  if (openCards(live).every((each) => each.toolCallId === toolCallId)) waitOn(live, false)
  const { address, claimKey } = claim
  const taken = resumed(live, [card])
  const responding = live.session
    .respondToToolSuspension({ address, resumeData, requestContext: live.run?.context })
    .catch((cause: unknown) => logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause })))
    .finally(() => live.session.releaseToolResponse(claimKey))
  await taken
  if (openCards(live).some((each) => each.toolCallId === toolCallId)) {
    // Mastra refused the resume and keeps the call parked (`resumeToolCall`): it can show the call
    // before it saved the parked run, and an answer that comes first loses Mastra's own claim.
    await responding
    tellCard(live, card)
    waitOn(live, true)
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'RESUME_REFUSED' } })
  }
}
