import { z } from 'zod'

/** A tool call's id, as the model's turn names it: what an answer to its question names. */
export const ToolCallId = z.string().min(1).max(200).brand('ToolCallId')
export type ToolCallId = z.infer<typeof ToolCallId>

/** The most questions one card holds, and how long one waits for its answer. */
export const QUESTION_LIMITS = { questions: 4, waitMs: 30 * 60_000 }

const Option = z.object({ label: z.string().min(1), description: z.string().optional() })
/** One question of a card: a choice among options or free text. */
export const Question = z.object({
  question: z.string().min(1),
  header: z.string().optional(),
  options: z.array(Option),
  multiSelect: z.boolean(),
})
export type Question = z.infer<typeof Question>

/** One task of the Builder's list. */
export const Task = z.object({
  id: z.string().min(1),
  content: z.string(),
  activeForm: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed']),
})

/** The longest answer or reason a person sends back to a card, in characters. */
const ANSWER_MAX_LENGTH = 20_000

/** A person's answer to one question: the one given, or the choices of a multiple one. */
export const Answer = z.union([
  z.string().min(1).max(ANSWER_MAX_LENGTH),
  z.array(z.string().min(1)),
])
export type Answer = z.infer<typeof Answer>

/** What a person answers a card with: one answer per question, or the decision on a plan. */
export const QuestionAnswer = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('answers'), answers: z.array(Answer) }),
  z
    .object({
      kind: z.literal('plan'),
      action: z.enum(['approved', 'rejected']),
      feedback: z.string().trim().min(1).max(ANSWER_MAX_LENGTH).optional(),
    })
    .refine((each) => each.action !== 'rejected' || each.feedback !== undefined, {
      message: 'a rejection says why',
      path: ['feedback'],
    }),
])
export type QuestionAnswer = z.infer<typeof QuestionAnswer>

const AskedCard = z.object({
  type: z.literal('question'),
  toolCallId: ToolCallId,
  questions: z.array(Question).min(1).max(QUESTION_LIMITS.questions),
})

/**
 * The card of questions the turn waits on. An answered card holds the answer to each question, in order (founder, 2026-10-22: "4. e 5 Sim").
 */
export const QuestionPart = z.discriminatedUnion('state', [
  AskedCard.extend({ state: z.enum(['open', 'expired', 'closed']) }),
  AskedCard.extend({ state: z.literal('answered'), answers: z.array(Answer) }),
])

/** The plan the turn waits on, read from the plan file. */
export const PlanPart = z.object({
  type: z.literal('plan'),
  toolCallId: ToolCallId,
  title: z.string(),
  plan: z.string(),
  state: z.enum(['open', 'approved', 'rejected', 'expired', 'closed']),
})

/** The task list as the Builder last wrote it. */
export const TasksPart = z.object({ type: z.literal('tasks'), items: z.array(Task) })
