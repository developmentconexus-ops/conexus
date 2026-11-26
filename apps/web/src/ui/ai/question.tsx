import { MessageCircleQuestionIcon } from 'lucide-react'
import type { ReactElement, ReactNode, SubmitEvent } from 'react'
import { Alert } from '../alert.tsx'
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
} from '../questionnaire.tsx'
import { Textarea } from '../textarea.tsx'
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../trace.tsx'

/** One answer per question: the choices of a multiple one, or the one given (`''` when none). */
type QuestionAnswer = string | readonly string[]

export type QuestionView = {
  id: string
  text: string
  multiple: boolean
  choices: readonly { value: string; label: string; hint: string | undefined }[]
}

export type QuestionState =
  | {
      kind: 'OPEN'
      waiting: ReactNode | undefined
      busy: boolean
      onSubmit: (answers: readonly QuestionAnswer[]) => void
    }
  /** `row` is the folded line; `answers`, one per question, when the conversation keeps them. */
  | { kind: 'ANSWERED'; row: string; answers: readonly string[] | undefined }
  /** Closed or stopped: `said` is why, when there is a sentence for it. */
  | { kind: 'CLOSED'; row: string; said: string | undefined }

export type QuestionText = {
  previous: string
  next: string
  submit: string
  sending: string
  other: string
  otherLabel: string
  answerLabel: string
  answerPlaceholder: string
  required: string
}

function fieldOf(at: number): string {
  return `q${at}`
}

function answersOf(form: FormData, questions: readonly QuestionView[]): QuestionAnswer[] {
  return questions.map((question, at) => {
    const given = form
      .getAll(fieldOf(at))
      .map(String)
      .filter((value) => value.trim() !== '')
    return question.multiple ? given : (given.at(-1) ?? '')
  })
}

function Ask(props: { question: QuestionView; at: number; text: QuestionText }) {
  const { question, at, text } = props
  const single = !question.multiple
  return (
    <QuestionnaireItem name={fieldOf(at)} multiple={!single} required>
      <QuestionnaireTitle>{question.text}</QuestionnaireTitle>
      {question.choices.length > 0 ? (
        <QuestionnaireChoices>
          {question.choices.map((choice, index) => (
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
            className="h-auto"
            aria-label={text.otherLabel}
            placeholder={text.other}
            render={<Textarea className="max-md:min-h-16" rows={1} />}
          />
        </QuestionnaireChoices>
      ) : (
        <QuestionnaireInput
          className="h-auto"
          aria-label={text.answerLabel}
          placeholder={text.answerPlaceholder}
          render={<Textarea className="max-md:min-h-16" rows={1} />}
        />
      )}
      <QuestionnaireError>{text.required}</QuestionnaireError>
    </QuestionnaireItem>
  )
}

/**
 * The agent's questions, one at a time, on shadcn's questionnaire, answered as Mastra's AskUser
 * answers: a choice among the options, the first chosen, or a free response. Once closed it keeps
 * its questions in a folded line; once answered, each answer under its question.
 */
export function Question(props: {
  questions: readonly QuestionView[]
  state: QuestionState
  /** The error of the send, shown in any state. */
  error: string | undefined
  text: QuestionText
}): ReactElement {
  const { questions, state, error, text } = props
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.kind === 'OPEN')
      state.onSubmit(answersOf(new FormData(event.currentTarget), questions))
  }
  const open = state.kind === 'OPEN'
  return (
    <div
      className={
        open
          ? 'flex min-w-0 flex-col gap-sm rounded-card border border-transparent bg-raised shadow-1 p-md md:p-sm'
          : 'flex min-w-0 flex-col gap-sm'
      }
    >
      {state.kind === 'OPEN' ? (
        <>
          {state.waiting}
          <Questionnaire onSubmit={submit}>
            {questions.map((question, at) => (
              <Ask key={question.id} question={question} at={at} text={text} />
            ))}
            <QuestionnaireActions>
              <QuestionnairePrevious>{text.previous}</QuestionnairePrevious>
              <QuestionnaireNext>{text.next}</QuestionnaireNext>
              <QuestionnaireSubmit disabled={state.busy}>
                {state.busy ? text.sending : text.submit}
              </QuestionnaireSubmit>
            </QuestionnaireActions>
          </Questionnaire>
        </>
      ) : (
        <TraceCollapsible>
          <TraceCollapsibleTrigger>
            <TraceLine>
              <TraceIcon>
                <MessageCircleQuestionIcon />
              </TraceIcon>
              <TraceTitle>{state.row}</TraceTitle>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent className="pt-xs">
            <ul className="flex flex-col gap-xs rounded-control bg-surface-3 p-sm text-fact text-text-2">
              {questions.map((question, at) => (
                <li key={question.id} className="flex flex-col">
                  {question.text}
                  {state.kind === 'ANSWERED' && state.answers && (
                    <span className="text-text">{state.answers[at] ?? ''}</span>
                  )}
                </li>
              ))}
            </ul>
            {state.kind === 'CLOSED' && state.said !== undefined && (
              <p className="pt-xs text-fact text-text-2">{state.said}</p>
            )}
          </TraceCollapsibleContent>
        </TraceCollapsible>
      )}
      {error !== undefined && <Alert tone="danger">{error}</Alert>}
    </div>
  )
}
