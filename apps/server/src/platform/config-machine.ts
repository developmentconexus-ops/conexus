import { z } from 'zod'
import { Secret } from './secret.ts'

/** The E2B template the build machines start from (decision 0051), built once by `infra/e2b`. */
export const MachineTemplate = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,62}$/)
  .brand('MachineTemplate')
export type MachineTemplate = z.infer<typeof MachineTemplate>

/** Starts, wakes and kills the build machines; `createMachines` reveals it into the E2B client (S36). */
export type E2bApiKey = Secret<'E2bApiKey'>
export const E2bApiKey = {
  parse(value: string): E2bApiKey {
    return new Secret('E2bApiKey', value)
  },
}

export const MachineEnvironment = z.object({
  HUB_E2B_API_KEY_FILE: z.string().min(1),
  HUB_E2B_TEMPLATE: MachineTemplate,
})
