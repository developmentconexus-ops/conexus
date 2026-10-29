import type { TestResult as Result, TestCheck } from '@conexus/hub-api'
import { cn } from '../../ui/cn.ts'
import { outcomeText, unreachableText } from './text.ts'

/**
 * What Testar found, at that moment: the parts the Sankhya let the user read, one by one. A
 * refusal of the keys is the row's own state, so it says nothing here.
 */
export function TestResult(props: { result: Result; name: string }) {
  const { result, name } = props
  if (result.result === 'AUTH_REFUSED') return null
  if (result.result === 'UNREACHABLE') {
    return (
      <p role="alert" className="text-danger">
        {unreachableText(name)}
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-sm">
      <p role="status" className="font-medium">
        Ligação funcionando
      </p>
      <ul aria-label="Resultado do teste" className="flex flex-col gap-sm">
        {subjectsOf(result.checks).map((subject) => (
          <li key={subject.label}>
            {subject.label}{' '}
            <span className={cn(subject.missing.length === 0 ? 'text-success' : 'text-text-2')}>
              {subject.missing.length === 0
                ? 'lê'
                : `lê ${subject.total - subject.missing.length} de ${subject.total}`}
            </span>
            {subject.missing.length > 0 && (
              <ul className="ml-md flex flex-col gap-xs text-text-2">
                {subject.missing.map((check) => (
                  <li key={check.id}>
                    {check.label} {outcomeText(check, name)}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The checks grouped by the subject the Hub names, in the order they arrive. */
function subjectsOf(checks: readonly TestCheck[]) {
  const subjects = new Map<string, { label: string; total: number; missing: TestCheck[] }>()
  for (const check of checks) {
    const subject = subjects.get(check.subject) ?? { label: check.subject, total: 0, missing: [] }
    subject.total += 1
    if (check.outcome !== 'READS') subject.missing.push(check)
    subjects.set(check.subject, subject)
  }
  return [...subjects.values()]
}
