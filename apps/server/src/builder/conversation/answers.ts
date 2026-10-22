import type { ProjectId, QuestionAnswer, ToolCallId } from '@conexus/hub-api'
import { LIBRARY_ANSWERS } from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import type { PackageGrants } from '../packages/public.ts'
import { tellCard } from './cards.ts'
import type { Card, Live } from './live.ts'
import { PLAN_PATH } from './plan-tools.ts'

/** What the tool resumes with for an answer, or the refusal of an answer that does not fit the card. */
function resumeOf(card: Card, body: QuestionAnswer): unknown {
  if (card.type === 'plan') {
    if (body.kind !== 'plan') throw new Failure('QUESTION_ANSWERS_INVALID')
    const { action, feedback } = body
    return { action, feedback, title: card.title, plan: card.plan, path: PLAN_PATH }
  }
  if (body.kind !== 'answers' || body.answers.length !== card.questions.length) {
    throw new Failure('QUESTION_ANSWERS_INVALID')
  }
  const fits = card.questions.every((question, index) => {
    const answer = body.answers[index]
    if (question.kind === 'library') {
      return answer === LIBRARY_ANSWERS.allow || answer === LIBRARY_ANSWERS.deny
    }
    return Array.isArray(answer) ? question.multiSelect : true
  })
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

/** Grants the Projeto each library the person allowed, before the turn goes on to check it. */
async function grantAllowed(
  live: Live,
  grants: PackageGrants,
  input: { projectId: ProjectId; card: Card; body: QuestionAnswer },
): Promise<void> {
  const { card, body } = input
  if (card.type !== 'question' || body.kind !== 'answers') return
  const { companyId, personId } = live.owner
  for (const [index, question] of card.questions.entries()) {
    if (question.kind !== 'library' || body.answers[index] !== LIBRARY_ANSWERS.allow) continue
    const library = { name: question.name, version: question.version }
    await grants.grant({ companyId, projectId: input.projectId, personId, library })
  }
}

/**
 * The person's answer to the card the turn waits on: the answers to its questions, or the decision
 * on its plan. The call is claimed first, so a second answer is `QUESTION_CLOSED`; the libraries the
 * person allowed are granted before the tool resumes, so the check finds them.
 */
export async function answerCard(
  live: Live,
  grants: PackageGrants,
  input: { projectId: ProjectId; toolCallId: ToolCallId; body: QuestionAnswer },
): Promise<void> {
  const { toolCallId, body } = input
  const found = live.pending.get(toolCallId)
  if (found === undefined || found.claimed) throw new Failure('QUESTION_CLOSED')
  const resumeData = resumeOf(found.card, body)
  found.claimed = true
  try {
    await grantAllowed(live, grants, { projectId: input.projectId, card: found.card, body })
    live.pending.delete(toolCallId)
    tellCard(live, answeredCard(found.card, body))
    if (live.pending.size === 0) await live.run?.waiting(false)
    await live.session.respondToToolSuspension({
      toolCallId,
      resumeData,
      requestContext: live.run?.context,
    })
  } catch (error) {
    found.claimed = false
    throw error
  }
}
