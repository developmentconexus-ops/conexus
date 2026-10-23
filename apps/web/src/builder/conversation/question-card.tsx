import type { Answer, Question, QuestionAnswer } from '@conexus/hub-api'
import { ToolCallId } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { SubmitEvent } from 'react'
import { useRef, useState } from 'react'
import { sentenceOfCode, writeFailureText } from '../../platform/hub.ts'
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '../../ui/questionnaire.tsx'
import { sendAnswer } from './queries.ts'
import type { QuestionCardItem } from './transcript.ts'

const route = getRouteApi(
  '/_app/companies/$companyId/projects/$projectId/conversations/$conversationId',
)

/** The card's words, from the state matrix of step 14's card. */
export const CARD_TEXT = {
  sending: 'Enviando…',
  unsent: 'Não foi possível enviar. Tente de novo.',
  expired: 'Esta pergunta expirou.',
  other: 'outra resposta…',
}

/**
 * Sends the person's answer to the card the turn waits on. A sent answer keeps the card busy until
 * the Hub says the card is answered (design V54); a refusal the Hub settled says its row's words,
 * any other the card's (code C37).
 */
export function useAnswer(toolCallId: ToolCallId) {
  const params = route.useParams()
  const send = useMutation({ ...sendAnswer, meta: { keepCache: true } })
  const [error, setError] = useState<string>()
  const sent = useRef(false)
  async function answer(body: QuestionAnswer): Promise<void> {
    if (sent.current) return
    sent.current = true
    setError(undefined)
    try {
      await send.mutateAsync({ params: { ...params, toolCallId }, body })
    } catch (failure) {
      sent.current = false
      setError(writeFailureText(failure, CARD_TEXT.unsent))
    }
  }
  return { answer, sending: send.isPending || send.isSuccess, error }
}

/** The answers a question offers: its options. */
function choicesOf(question: Question): { value: string; label: string; hint?: string }[] {
  return question.options.map((option) => ({
    value: option.label,
    label: option.label,
    hint: option.description,
  }))
}

/** One answer per question, as the form holds it: the choices of a multiple one, or the one given. */
function answersOf(form: FormData, questions: readonly Question[]): QuestionAnswer {
  const answers = questions.map((question, at) => {
    const given = form
      .getAll(`q${at}`)
      .map(String)
      .filter((value) => value.trim() !== '')
    return question.multiSelect ? given : (given.at(-1) ?? '')
  })
  return { kind: 'answers', answers }
}

function Ask({ question, at }: { question: Question; at: number }) {
  const choices = choicesOf(question)
  const single = !question.multiSelect
  const hasChoices = choices.length > 0
  return (
    <QuestionnaireItem name={`q${at}`} multiple={!single} required>
      <QuestionnaireTitle>{question.question}</QuestionnaireTitle>
      {hasChoices ? (
        <QuestionnaireChoices>
          {choices.map((choice, index) => (
            <QuestionnaireChoice
              key={choice.value}
              value={choice.value}
              defaultChecked={single && index === 0}
            >
              <span>{choice.label}</span>
              {choice.hint && <span className="text-fact text-text-2">{choice.hint}</span>}
            </QuestionnaireChoice>
          ))}
          <QuestionnaireInput
            aria-label="Outra resposta"
            placeholder={CARD_TEXT.other}
            render={
              <textarea
                className="w-full min-h-16 rounded-control border border-line bg-surface p-sm text-base text-text md:text-body resize-y"
                rows={2}
              />
            }
          />
        </QuestionnaireChoices>
      ) : (
        <QuestionnaireInput
          aria-label="Resposta"
          placeholder="Escreva sua resposta…"
          render={
            <textarea
              className="w-full min-h-20 rounded-control border border-line bg-surface p-sm text-base text-text md:text-body resize-y"
              rows={3}
            />
          }
        />
      )}
      <QuestionnaireError>Escolha ou escreva uma resposta para continuar.</QuestionnaireError>
    </QuestionnaireItem>
  )
}

function answerText(answer: Answer | undefined): string {
  return Array.isArray(answer) ? answer.join(', ') : (answer ?? '')
}

function closedText(state: QuestionCardItem['state']): string | undefined {
  if (state === 'expired') return CARD_TEXT.expired
  return state === 'closed' ? sentenceOfCode('QUESTION_CLOSED') : undefined
}

/**
 * The Builder's questions, one at a time, on shadcn's `questionnaire`: a choice among its options,
 * the recommended first and chosen, or a multiline free response typed (Criterion 12, #272).
 * Once closed it keeps only its questions; once answered, each answer under its question.
 */
export function QuestionCard({ part }: { part: QuestionCardItem }) {
  const toolCallId = ToolCallId.parse(part.toolCallId)
  const { answer, sending, error } = useAnswer(toolCallId)
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    void answer(answersOf(new FormData(event.currentTarget), part.questions))
  }
  const said = closedText(part.state)
  return (
    <div className="flex min-w-0 flex-col gap-sm rounded-card border border-line bg-surface p-md">
      {part.state === 'open' ? (
        <Questionnaire onSubmit={submit}>
          {part.questions.map((question, at) => (
            <Ask key={question.question} question={question} at={at} />
          ))}
          <QuestionnaireActions>
            <QuestionnairePrevious>Anterior</QuestionnairePrevious>
            <QuestionnaireNext>Próxima</QuestionnaireNext>
            <QuestionnaireSubmit disabled={sending}>
              {sending ? CARD_TEXT.sending : 'Enviar'}
            </QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
      ) : (
        <ul className="flex flex-col gap-xs text-text-2">
          {part.questions.map((question, at) => (
            <li key={question.question} className="flex flex-col">
              {question.question}
              {part.state === 'answered' && part.answers && (
                <span className="text-text">{answerText(part.answers[at])}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {said !== undefined && <p className="text-text-2">{said}</p>}
      {error !== undefined && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
