import type { Mastra } from '@mastra/core/mastra'
import type { CopyClock } from '../../hub/copies/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { ReleaseScope } from '../controller-kit/public.ts'
import { createCopyClock, releaseCopies } from './clock.ts'

export { COPY_WORKFLOW, copyRun } from './workflow.ts'

/**
 * The copies' clock on the Hub's one `Mastra` (Capacidade 2): the schedules, and the removal the Hub
 * runs before a company's conversations'.
 */
export function copyClockOf(deps: { mastra: Mastra; log: FailureLog }) {
  const clock: CopyClock = createCopyClock(deps)
  return Object.freeze({
    clock,
    release: (scope: ReleaseScope) => releaseCopies({ clock, log: deps.log }, scope),
  })
}
