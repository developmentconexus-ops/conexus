import { z } from 'zod'

/** Why a treatment run failed, and the only text a failed run carries. */
export const TREATMENT_RUN_FAILURES = [
  'TREAT_START_FAILED',
  'TREAT_TASK_STOPPED',
  'TREAT_SPEC_INVALID',
  'TREAT_ENGINE_FAILED',
] as const
export const TreatmentRunFailure = z.enum(TREATMENT_RUN_FAILURES)
export type TreatmentRunFailure = z.infer<typeof TreatmentRunFailure>
