import type { CheckReport } from '@conexus/app/check'
import type { ToolDetail } from '@conexus/hub-api'
import { DETAIL_LIMITS, SUBJECT_MAX_LENGTH } from '@conexus/hub-api'

/** What a failed check found first: its step and its first problem, where it is. */
export function foundBy(report: CheckReport): string | undefined {
  const step = report.steps.find(({ state }) => state === 'failed')
  const first = step?.problems[0]
  if (step === undefined || first === undefined) return undefined
  const place =
    first.file === null ? '' : ` ${first.file}${first.line === null ? '' : `:${first.line}`}`
  return `${step.name}:${place} ${first.message.split('\n')[0]}`.slice(0, SUBJECT_MAX_LENGTH)
}

/** A check's report as its row opens on it: every step, each problem cut short. */
export function checkDetail(report: CheckReport): ToolDetail {
  let cut = false
  const steps = report.steps.map(({ name, state, problems }) => ({
    name,
    state,
    problems: problems.map(({ file, line, message }) => {
      cut ||= message.length > DETAIL_LIMITS.problemCharacters
      return { file, line, message: message.slice(0, DETAIL_LIMITS.problemCharacters) }
    }),
  }))
  return { kind: 'check', steps, cut }
}
