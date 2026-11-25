import { CheckIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from './cn.ts'

// The wizard's bar as the Nekt draws it (numbered steps, the done ones ticked, the current one
// marked), built from the sheet's tokens; no library has the piece. It is a list to read, not a
// control: no step is a tab stop, since the window moves the person with its own buttons.
// Under `sm` the bar gives way to one line, "Passo n de N · nome", which the caller words.
export function StepBar(props: {
  /** The list's name for a screen reader. */
  label: string
  steps: readonly string[]
  /** The step being done, from 0; null when all are done. */
  current: number | null
  /** What a screen reader hears after a step already done, which the tick alone does not say. */
  doneLabel: string
  /** The one line that stands for the bar under `sm`. */
  phoneLine: string
  className?: string
}) {
  const { steps, current } = props
  return (
    <div data-slot="step-bar" className={props.className}>
      <ol
        aria-label={props.label}
        className="flex flex-wrap items-center gap-sm text-text-2 max-sm:hidden"
      >
        {steps.map((name, at) => {
          const done = current === null || at < current
          const now = at === current
          return (
            <li
              key={name}
              aria-current={now ? 'step' : undefined}
              className="flex items-center gap-sm"
            >
              {at > 0 && <ChevronRightIcon aria-hidden="true" className="size-3.5" />}
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-pill border text-eyebrow tabular-nums',
                  now ? 'border-accent bg-surface text-text' : 'border-line bg-surface-3',
                )}
              >
                {done ? <CheckIcon aria-hidden="true" className="size-3" /> : at + 1}
              </span>
              <span className={now ? 'font-medium text-text' : undefined}>{name}</span>
              {done && <span className="sr-only">, {props.doneLabel}</span>}
            </li>
          )
        })}
      </ol>
      <p className="text-text-2 sm:hidden">{props.phoneLine}</p>
    </div>
  )
}
