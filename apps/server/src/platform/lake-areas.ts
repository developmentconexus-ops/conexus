import { z } from 'zod'

/**
 * A lake's areas, the server's one owner of the list (C26). The recipe creates them and
 * `infra/aws/lib/actions.ts` splits them by role; `lake-areas.test.ts` checks the three agree.
 */
export const LAKE_AREAS = ['raw', 'current', 'tratado', 'negocio'] as const
export const LakeArea = z.enum(LAKE_AREAS)
export type LakeArea = z.infer<typeof LakeArea>
