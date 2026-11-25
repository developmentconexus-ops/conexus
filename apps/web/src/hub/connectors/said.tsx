import type { TestResult as Answer, ConnectionLinkAnswered, Native } from '@conexus/hub-api'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible.tsx'
import { refusedKeysText } from './lake-text.ts'
import {
  appRefusedText,
  busyText,
  nativeText,
  readRefusedText,
  reasonText,
  serverErrorText,
  UNREADABLE_TEXT,
  unreachableText,
} from './text.ts'

/**
 * What the provider said, as text: its status and code on one line, its message when it sent one,
 * why a 2xx did not read, and its body, shut until asked for.
 */
export function Said(props: { native: Native; name: string }) {
  const { native } = props
  const body = native.body === undefined || native.body === null ? undefined : native.body
  return (
    <div className="flex flex-col gap-xs">
      <p className="break-words text-text-2">{nativeText(native, props.name)}</p>
      {native.reason !== undefined && (
        <p className="break-words text-text-2">{reasonText(native.reason)}</p>
      )}
      {body !== undefined && (
        <Collapsible>
          <CollapsibleTrigger className="text-text-2 underline underline-offset-2">
            Ver a resposta inteira
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-control border border-line bg-surface-3 p-sm font-mono text-fact">
              {typeof body === 'string' ? body : JSON.stringify(body, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

/** A test that did not work, as Testar and as a link's send tell it; the link's never carries the connection. */
export type Refusal =
  | Exclude<Answer, { result: 'WORKING' }>
  | Exclude<ConnectionLinkAnswered, { result: 'WORKING' }>

/** The sentence of a Testar that did not work; the refused keys are the connection's state, said once above. */
function refusalText(answer: Refusal, name: string): string | null {
  switch (answer.result) {
    case 'AUTH_REFUSED':
      return null
    case 'READ_REFUSED':
      return readRefusedText(name, answer.read)
    case 'BUSY':
      return busyText(name, answer.waitMs)
    case 'UNREACHABLE':
      return answer.native === null ? unreachableText(name) : serverErrorText(name)
    case 'UNREADABLE':
      return UNREADABLE_TEXT
    case 'APP_REFUSED':
      return appRefusedText(name)
    default:
      return answer satisfies never
  }
}

/** What a Testar that did not work says, with what the provider answered. */
export function TestRefusal(props: { answer: Refusal; name: string }) {
  const { answer, name } = props
  const sentence = refusalText(answer, name)
  return (
    <div role="alert" className="flex flex-col gap-xs">
      {sentence !== null && <p className="text-danger">{sentence}</p>}
      {answer.native !== null && <Said native={answer.native} name={name} />}
    </div>
  )
}

/** A refused test above the keys: the sentence about the keys when they were refused, then what the system answered. */
export function Refused(props: { answer: Refusal; name: string }) {
  return (
    <div role="alert" className="flex flex-col gap-xs">
      {props.answer.result === 'AUTH_REFUSED' && (
        <p className="text-danger">{refusedKeysText(props.name)}</p>
      )}
      <TestRefusal answer={props.answer} name={props.name} />
    </div>
  )
}
