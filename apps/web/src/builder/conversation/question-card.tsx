import type { Answer, Question } from '@conexus/hub-api'
import { ToolCallId } from '@conexus/hub-api'
import type { PlanResume } from '@mastra/client-js'
import { getRouteApi } from '@tanstack/react-router'
import { MessageCircleQuestionIcon } from 'lucide-react'
import type { SubmitEvent } from 'react'
import { useMemo, useRef, useState } from 'react'
import { ConexusMark } from '../../brand/mark.tsx'
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
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../../ui/trace.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import type { QuestionCardItem } from './rows.ts'
import { sessionOf } from './session.ts'

const route = getRouteApi(
  '/_app/companies/$companyId/projects/$projectId/conversations/$conversationId',
)

/** The card's words, from the state matrix of step 14's card. */
export const CARD_TEXT = {
  sending: 'Enviando…',
  unsent: 'Não foi possível enviar. Tente de novo.',
  other: 'outra resposta…',
  stopped: 'Você parou o Builder.',
}

/** The collapsed row of a card no longer open, as the skill and tool rows are. */
function rowTitle(state: QuestionCardItem['state'], count: number): string {
  const questions = count === 1 ? '1 pergunta' : `${count} perguntas`
  return state === 'answered' ? `Respondeu ${questions}` : `${questions} sem resposta`
}

/** On a phone the card says the Builder waits on the person, in place of the working line (founder, 2026-10-22, "Aprovo"). */
export function WaitingCaption() {
  if (!useIsMobile()) return null
  return (
    <p role="status" className="flex items-center gap-sm text-label text-accent">
      <ConexusMark size={16} />
      Builder esperando sua resposta
    </p>
  )
}

/**
 * Sends the person's answer to the call Mastra keeps waiting, on its own route. A sent answer keeps
 * the card busy until the stream says the call is answered (design V54); one Mastra no longer waits
 * on, or a refusal, says the card's words, or the Hub's row's (code C37).
 */
export function useAnswer(toolCallId: ToolCallId) {
  const { conversationId } = route.useParams()
  const builder = useMemo(() => sessionOf(conversationId), [conversationId])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string>()
  const sent = useRef(false)
  async function answer(resumeData: readonly Answer[] | PlanResume): Promise<void> {
    if (sent.current) return
    sent.current = true
    setSending(true)
    setError(undefined)
    try {
      const { ok } = await builder.answer(toolCallId, resumeData)
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

/** The answers a question offers: its options. */
function choicesOf(question: Question): { value: string; label: string; hint?: string }[] {
  return question.options.map((option) => ({
    value: option.label,
    label: option.label,
    hint: option.description,
  }))
}

/** One answer per question, as the form holds it: the choices of a multiple one, or the one given. */
function answersOf(form: FormData, questions: readonly Question[]): Answer[] {
  return questions.map((question, at) => {
    const given = form
      .getAll(`q${at}`)
      .map(String)
      .filter((value) => value.trim() !== '')
    return question.multiSelect ? given : (given.at(-1) ?? '')
  })
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
                className="w-full min-h-9 max-md:min-h-16 field-sizing-content max-h-40 rounded-control border border-line bg-surface px-sm py-xs text-base text-text md:text-body resize-none"
                rows={1}
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
              className="w-full min-h-9 max-md:min-h-16 field-sizing-content max-h-40 rounded-control border border-line bg-surface px-sm py-xs text-base text-text md:text-body resize-none"
              rows={1}
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
  if (state === 'stopped') return CARD_TEXT.stopped
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
  const open = part.state === 'open'
  return (
    <div
      className={
        open
          ? 'flex min-w-0 flex-col gap-sm rounded-card border border-line bg-surface p-md md:p-sm'
          : 'flex min-w-0 flex-col gap-sm'
      }
    >
      {open && <WaitingCaption />}
      {open ? (
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
        <TraceCollapsible>
          <TraceCollapsibleTrigger>
            <TraceLine>
              <TraceIcon>
                <MessageCircleQuestionIcon />
              </TraceIcon>
              <TraceTitle>{rowTitle(part.state, part.questions.length)}</TraceTitle>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent className="pt-xs">
            <ul className="flex flex-col gap-xs rounded-control bg-surface-3 p-sm text-fact text-text-2">
              {part.questions.map((question, at) => (
                <li key={question.question} className="flex flex-col">
                  {question.question}
                  {part.state === 'answered' && part.answers && (
                    <span className="text-text">{answerText(part.answers[at])}</span>
                  )}
                </li>
              ))}
            </ul>
            {said !== undefined && <p className="pt-xs text-fact text-text-2">{said}</p>}
          </TraceCollapsibleContent>
        </TraceCollapsible>
      )}
      {error !== undefined && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
