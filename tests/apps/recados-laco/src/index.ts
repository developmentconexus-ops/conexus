import { serveApp } from '@conexus/app-contract'
import { z } from 'zod'
import { operations } from '../../recados/src/operations.ts'
import { handlers } from '../../recados/src/recados.ts'

/** Recados whose Travar never ends: the CPU limit of the call cuts it (step 10). */
export default serveApp({
  operations: {
    ...operations,
    travar: { input: z.strictObject({}), output: z.strictObject({}) },
  },
  handlers: {
    ...handlers,
    travar: () => {
      let voltas = 0
      while (voltas >= 0) voltas += 1
    },
  },
})
