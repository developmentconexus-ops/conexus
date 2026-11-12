import { Question } from '@conexus/hub-api'
import { z } from 'zod'

const QuestionItemSchema = Question.partial({ options: true, multiSelect: true })

/**
 * OpenAI's strict mode makes every optional field of a tool nullable and required (Mastra's schema
 * compat), so the model sends `null` for what it does not use; the Builder's messages keep the
 * arguments as the model sent them. A `null` field reads as an absent one.
 */
function withoutNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutNulls)
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, each]) =>
      each === null ? [] : [[key, withoutNulls(each)]],
    ),
  )
}

export function parseQuestions(input: unknown): Question[] {
  const parsed = z.object({ questions: z.array(QuestionItemSchema) }).safeParse(withoutNulls(input))
  if (!parsed.success) return []
  return parsed.data.questions.map((q) => ({
    question: q.question,
    header: q.header,
    options: q.options ?? [],
    multiSelect: q.multiSelect ?? false,
  }))
}
