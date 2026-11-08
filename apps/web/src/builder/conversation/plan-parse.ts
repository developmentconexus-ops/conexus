import { z } from 'zod'

/** What Mastra's `submit_plan` returns once answered: the plan as submitted and the decision on it. */
export const SubmittedPlan = z.object({
  submittedPlan: z.object({
    action: z.string(),
    title: z.string().optional(),
    plan: z.string().optional(),
  }),
})

const PlanArgs = z.object({ title: z.string(), plan: z.string(), path: z.string() }).partial()

export function parsePlan(input: unknown): { title: string; plan: string; path?: string } {
  const parsed = PlanArgs.safeParse(input).data
  return { title: parsed?.title ?? '', plan: parsed?.plan ?? '', path: parsed?.path }
}
