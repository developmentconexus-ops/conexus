import { z } from 'zod'

/** A tool call's id, as the model's turn names it: what an answer to its question names. */
export const ToolCallId = z.string().min(1).max(200).brand('ToolCallId')
export type ToolCallId = z.infer<typeof ToolCallId>

/** A package of the npm registry, by its name. */
export const PackageName = z
  .string()
  .max(214)
  .regex(/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/)
  .brand('PackageName')
export type PackageName = z.infer<typeof PackageName>

/** The two answers to a library's question, in the person's language. */
export const LIBRARY_ANSWERS = { allow: 'Permitir', deny: 'Não, faça sem ela' } as const

/** The most questions one card holds, and how long one waits for its answer. */
export const QUESTION_LIMITS = { questions: 4, waitMs: 30 * 60_000 }

const Option = z.object({ label: z.string().min(1), description: z.string().optional() })
/** One question of a card: a choice among options or free text, or a library to allow. */
export const Question = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('choice'),
    question: z.string().min(1),
    header: z.string().optional(),
    options: z.array(Option),
    multiSelect: z.boolean(),
  }),
  z.object({
    kind: z.literal('library'),
    question: z.string().min(1),
    name: PackageName,
    version: z.string().min(1),
  }),
])
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

/** What a person answers a card with: one answer per question, or the decision on a plan. */
export const QuestionAnswer = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('answers'),
    answers: z.array(
      z.union([z.string().min(1).max(ANSWER_MAX_LENGTH), z.array(z.string().min(1))]),
    ),
  }),
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

/** The card of questions the turn waits on; a library's is the same card with `kind: 'library'`. */
export const QuestionPart = z.object({
  type: z.literal('question'),
  toolCallId: ToolCallId,
  questions: z.array(Question).min(1).max(QUESTION_LIMITS.questions),
  state: z.enum(['open', 'answered', 'expired', 'closed']),
})

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
