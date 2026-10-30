import type { KeptCheck, Native, TestCheck } from '@conexus/hub-api'
import { ChevronDownIcon } from 'lucide-react'
import { Badge } from '../../ui/badge.tsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible.tsx'
import {
  hintText,
  nativeText,
  othersText,
  outcomeText,
  reads,
  reasonText,
  verdictOf,
} from './text.ts'

export type Check = TestCheck | KeptCheck

/** The checks grouped by the subject the Hub names, in the order they arrive. */
function subjectsOf(checks: readonly Check[]) {
  const subjects = new Map<string, Check[]>()
  for (const check of checks) {
    subjects.set(check.subject, [...(subjects.get(check.subject) ?? []), check])
  }
  return [...subjects].map(([label, items]) => ({ label, items }))
}

/** How many subjects a test has and how many of them read whole. */
export function countOf(checks: readonly Check[] | null) {
  const subjects = checks === null ? [] : subjectsOf(checks)
  return {
    subjects: subjects.length,
    whole: subjects.filter((one) => verdictOf(one.items).whole).length,
  }
}

/**
 * What the provider said, as text: its status and code on one line, its message when it sent one,
 * why a 2xx did not read, and in a fresh answer its body, shut until asked for. The kept test has
 * the status and code only.
 */
export function Said(props: { native: Pick<Native, 'status' | 'code'> | Native; name: string }) {
  const { native } = props
  const full = 'body' in native
  const message = full ? native.message : null
  const body = full && native.body !== undefined && native.body !== null ? native.body : undefined
  const reason = full ? native.reason : undefined
  return (
    <div className="flex flex-col gap-xs">
      <p className="break-words text-text-2">
        {nativeText({ status: native.status, code: native.code, message }, props.name)}
      </p>
      {reason !== undefined && <p className="break-words text-text-2">{reasonText(reason)}</p>}
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

function Item(props: { check: Check; name: string }) {
  const { check, name } = props
  return (
    <li className="flex flex-col gap-xs">
      <span className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
        <span>{check.label}</span>
        <span className="text-text-2">{outcomeText(check, name)}</span>
      </span>
      {'native' in check && <Said native={check.native} name={name} />}
    </li>
  )
}

function Subject(props: { label: string; items: readonly Check[]; name: string }) {
  const { label, items, name } = props
  const verdict = verdictOf(items)
  const shown = verdict.whole ? items : items.filter((one) => !reads(one))
  const hint = hintText(items, name)
  const others = items.filter(reads).map((one) => one.label)
  return (
    <li className="border-b border-line last:border-b-0">
      {/* A new test can change whether the subject reads whole, so it opens or shuts again with it. */}
      <Collapsible key={String(verdict.whole)} defaultOpen={!verdict.whole}>
        <CollapsibleTrigger className="group flex w-full flex-wrap items-center justify-between gap-x-md gap-y-xs px-sm py-md text-left hover:bg-surface-3">
          <span className="font-medium">{label}</span>
          <span className="flex items-center gap-sm">
            <Badge tone={verdict.tone}>{verdict.text}</Badge>
            <ChevronDownIcon
              aria-hidden="true"
              className="size-4 group-data-panel-open:rotate-180"
            />
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-sm px-sm pb-md">
            <ul className="flex flex-col gap-sm">
              {shown.map((check) => (
                <Item key={check.id} check={check} name={name} />
              ))}
            </ul>
            {!verdict.whole && others.length > 0 && (
              <p className="text-text-2">{othersText(others)}</p>
            )}
            {hint !== '' && <p className="text-text-2">{hint}</p>}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

/** What a test found, one line per subject: the ones that read whole shut, the others open on what did not. */
export function TestResult(props: { checks: readonly Check[]; name: string }) {
  return (
    <ul aria-label="Resultado do teste" className="flex flex-col border-y border-line">
      {subjectsOf(props.checks).map((subject) => (
        <Subject key={subject.label} {...subject} name={props.name} />
      ))}
    </ul>
  )
}
