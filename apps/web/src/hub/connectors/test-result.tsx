import type { TestResult as Result } from '@conexus/hub-api'
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
      <ul
        aria-label="Resultado do teste"
        className="flex flex-col gap-xs md:flex-row md:flex-wrap md:gap-x-md"
      >
        {result.checks.map((check) => (
          <li key={check.id}>
            {check.label}{' '}
            <span className={cn(check.outcome === 'READS' ? 'text-success' : 'text-text-2')}>
              {outcomeText(check, name)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
