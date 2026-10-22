import { z } from 'zod'

/**
 * The bounds of one check (code C26). 20 problems a step, the first ones: what vibesdk gives its
 * model (`worker/agents/prompts.ts:140`, `maxIssues = 20`) and Biome prints by default
 * (`--max-diagnostics` 20); Conexus OS kept 50 with no written reason (`check/report.ts`
 * MAX_PROBLEMS). 60 s a step and 4 checks a turn: the card of step 14, "Os limites".
 */
export const CHECK_LIMITS = Object.freeze({ problems: 20, stepMs: 60_000, checks: 4 })

/** The longest message a problem keeps, in characters (Conexus OS `e0353c36` `check/report.ts:21`). */
const MESSAGE_CHARS = 2_000

/** The steps, in the order they run: one that fails skips the ones after it (decision 0055). */
export const STEP_NAMES = [
  'dependências',
  'manifesto',
  'tipos',
  'telas',
  'worker',
  'navegador',
] as const
export type StepName = (typeof STEP_NAMES)[number]

/** Where the check leaves its work in the app folder: under `node_modules`, which never leaves the machine. */
export const WORK_FOLDER = 'node_modules/.conexus'

/** The folder of the version the last passing check made, relative to the app folder. */
export const VERSION_FOLDER = `${WORK_FOLDER}/version`

export const Problem = z.strictObject({
  file: z.string().nullable(),
  line: z.int().positive().nullable(),
  column: z.int().positive().nullable(),
  code: z.string().min(1),
  message: z.string().max(MESSAGE_CHARS),
})
export type Problem = z.infer<typeof Problem>

const Step = z.strictObject({
  name: z.enum(STEP_NAMES),
  state: z.enum(['passed', 'failed', 'skipped', 'informed']),
  problems: z.array(Problem).max(CHECK_LIMITS.problems),
})

/** What the check prints and the server reads (code C27): every step in order, `ok` when none failed. */
export const CheckReport = z
  .strictObject({ ok: z.boolean(), steps: z.array(Step) })
  .refine(({ steps }) => steps.map(({ name }) => name).join() === STEP_NAMES.join(), 'steps')
  .refine(({ ok, steps }) => ok === steps.every(({ state }) => state !== 'failed'), 'ok')
export type CheckReport = z.infer<typeof CheckReport>

function clip(text: string, chars: number): string {
  return text.length > chars ? `${text.slice(0, chars - 1)}…` : text
}

/**
 * The first problems a step keeps, each message cut to its bound; the last one kept says how many
 * more there were, so the model knows the list is not whole.
 */
export function firstProblems(problems: readonly Problem[]): Problem[] {
  const kept = problems.slice(0, CHECK_LIMITS.problems)
  const cut = problems.length - kept.length
  return kept.map((problem, at) => {
    const note = cut > 0 && at === kept.length - 1 ? ` (${cut} more problems not shown)` : ''
    return { ...problem, message: clip(problem.message, MESSAGE_CHARS - note.length) + note }
  })
}
