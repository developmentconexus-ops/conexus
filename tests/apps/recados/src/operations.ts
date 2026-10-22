import { z } from 'zod'

/** Recados's operations in its own Zod (decision 0055), which the defect apps of step 10 reuse. */
export const operations = {
  listarRecados: {
    input: z.strictObject({}),
    output: z.array(z.strictObject({ id: z.int(), texto: z.string() })).max(100),
  },
  escreverRecado: {
    input: z.strictObject({ texto: z.string().min(1).max(500) }),
    output: z.strictObject({ id: z.int() }),
  },
}
