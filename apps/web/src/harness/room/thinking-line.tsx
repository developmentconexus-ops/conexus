import { ReasoningLine } from '../../ui/ai/reasoning-line.tsx'
import { Markdown } from './markdown.tsx'
import type { ReasoningItem } from './rows.ts'
import { durationOf } from './text.ts'

function thoughtOf(seconds: number | null | undefined, running: boolean): string {
  if (running) return 'Pensando…'
  return seconds === null || seconds === undefined || seconds < 1
    ? 'Pensou'
    : `Pensou por ${durationOf(seconds)}`
}

/**
 * The reasoning disclosure (Criterion 9, V39 amended):
 * "Pensando…" while reasoning runs; then "Pensou por N s" (or "Pensou"), closed by default,
 * expanding on click to show the model's reasoning in Markdown.
 */
export function ThinkingLine({ part }: { part: ReasoningItem }) {
  const running = part.streaming
  const reasoning = part.reasoning.trim()
  return (
    <ReasoningLine
      label={thoughtOf(part.seconds, running)}
      state={
        running
          ? { kind: 'THINKING' }
          : {
              kind: 'DONE',
              body: reasoning.length === 0 ? undefined : <Markdown text={reasoning} />,
            }
      }
    />
  )
}
