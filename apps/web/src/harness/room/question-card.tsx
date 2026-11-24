import type { Answer, Question } from '@conexus/hub-api'
import { ToolCallId } from '@conexus/hub-api'
import type { PlanResume } from '@mastra/client-js'
import { useRef, useState } from 'react'
import { sentenceOfCode, writeFailureText } from '../../platform/hub.ts'
import type { QuestionState, QuestionText, QuestionView } from '../../ui/ai/question.tsx'
import { Question as Questions } from '../../ui/ai/question.tsx'
import type { NoteResume } from './note-parse.ts'
import { useAnswerTo, useRoom } from './room.ts'
import type { QuestionCardItem } from './rows.ts'
import { WaitingOnPhone } from './working-line.tsx'

/** The card's words, from the state matrix of step 14's card. */
export const CARD_TEXT = {
  sending: 'Enviando…',
  unsent: 'Não foi possível enviar. Tente de novo.',
  other: 'outra resposta…',
}

const QUESTION_TEXT: QuestionText = {
  previous: 'Anterior',
  next: 'Próxima',
  submit: 'Enviar',
  sending: CARD_TEXT.sending,
  other: CARD_TEXT.other,
  otherLabel: 'Outra resposta',
  answerLabel: 'Resposta',
  answerPlaceholder: 'Escreva sua resposta…',
  required: 'Escolha ou escreva uma resposta para continuar.',
}

/** The collapsed row of a card no longer open, as the skill and tool rows are. */
function rowTitle(state: QuestionCardItem['state'], count: number): string {
  const questions = count === 1 ? '1 pergunta' : `${count} perguntas`
  return state === 'answered' ? `Respondeu ${questions}` : `${questions} sem resposta`
}

/**
 * Sends the person's answer to the call Mastra keeps waiting, on its own route. A sent answer keeps
 * the card busy until the stream says the call is answered (design V54); one Mastra no longer waits
 * on, or a refusal, says the card's words, or the Hub's row's (code C37).
 */
export function useAnswer(toolCallId: ToolCallId) {
  const answerTo = useAnswerTo()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string>()
  const sent = useRef(false)
  async function answer(resumeData: readonly Answer[] | PlanResume | NoteResume): Promise<void> {
    if (sent.current) return
    sent.current = true
    setSending(true)
    setError(undefined)
    try {
      const { ok } = await answerTo(toolCallId, resumeData)
      if (ok) return
      setError(CARD_TEXT.unsent)
    } catch (failure) {
      setError(writeFailureText(failure, CARD_TEXT.unsent))
    }
    sent.current = false
    setSending(false)
  }
  return { answer, sending, error }
}

/** A question as the card shows it: its options, the recommended first. */
function viewOf(question: Question): QuestionView {
  return {
    id: question.question,
    text: question.question,
    multiple: question.multiSelect,
    choices: question.options.map((option) => ({
      value: option.label,
      label: option.label,
      hint: option.description,
    })),
  }
}

function answerText(answer: Answer | undefined): string {
  return Array.isArray(answer) ? answer.join(', ') : (answer ?? '')
}

function closedText(state: QuestionCardItem['state'], agent: string): string | undefined {
  if (state === 'stopped') return `Você parou o ${agent}.`
  return state === 'closed' ? sentenceOfCode('QUESTION_CLOSED') : undefined
}

/**
 * The Builder's questions, one at a time, on shadcn's `questionnaire`: a choice among its options,
 * the recommended first and chosen, or a multiline free response typed (Criterion 12, #272).
 * Once closed it keeps only its questions; once answered, each answer under its question.
 */
export function QuestionCard({ part }: { part: QuestionCardItem }) {
  const { answer, sending, error } = useAnswer(ToolCallId.parse(part.toolCallId))
  const { agent } = useRoom()
  const count = part.questions.length
  const state: QuestionState =
    part.state === 'open'
      ? {
          kind: 'OPEN',
          waiting: <WaitingOnPhone />,
          busy: sending,
          onSubmit: (answers) =>
            void answer(answers.map((one) => (typeof one === 'string' ? one : [...one]))),
        }
      : part.state === 'answered'
        ? {
            kind: 'ANSWERED',
            row: rowTitle(part.state, count),
            answers: part.answers?.map(answerText),
          }
        : { kind: 'CLOSED', row: rowTitle(part.state, count), said: closedText(part.state, agent) }
  return (
    <Questions
      questions={part.questions.map(viewOf)}
      state={state}
      error={error}
      text={QUESTION_TEXT}
    />
  )
}
