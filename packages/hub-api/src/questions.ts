import { z } from 'zod'

/** A tool call's id, as the model's turn names it: what an answer to its question names. */
export const ToolCallId = z.string().min(1).max(200).brand('ToolCallId')
export type ToolCallId = z.infer<typeof ToolCallId>

/** The most questions one card holds; a card waits for its answer with no deadline. */
export const QUESTION_LIMITS = { questions: 4 }

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
export type Task = z.infer<typeof Task>

/** The longest answer or reason a person sends back to a card, in characters. */
const ANSWER_MAX_LENGTH = 20_000

/** A person's answer to one question: the one given, or the choices of a multiple one. */
export const Answer = z.union([
  z.string().min(1).max(ANSWER_MAX_LENGTH),
  z.array(z.string().min(1)),
])
export type Answer = z.infer<typeof Answer>
