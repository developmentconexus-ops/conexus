import { CARD_TOOLS, Question } from '@conexus/hub-api'
import { z } from 'zod'
import type { Message } from './messages.ts'

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

/**
 * What each question call asked, from the arguments of its call in any message: the resumed run
 * tells the result alone, so the card must not wait for the call to be drawn to know its questions.
 */
export function questionsAsked(messages: readonly Message[]): Map<string, Question[]> {
  const asked = new Map<string, Question[]>()
  for (const part of messages.flatMap((message) => message.parts)) {
    if (part.type !== 'tool-invocation' || part.toolInvocation.toolName !== CARD_TOOLS.question)
      continue
    const questions = parseQuestions(part.toolInvocation.args)
    if (questions.length > 0) asked.set(part.toolInvocation.toolCallId, questions)
  }
  return asked
}
