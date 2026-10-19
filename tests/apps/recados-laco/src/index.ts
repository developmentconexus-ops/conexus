import { serveApp } from '@conexus/app-contract'
import { handlers } from '../../recados/src/recados.ts'
import manifest from '../manifest.json' with { type: 'json' }

/** Recados whose Travar never ends: the CPU limit of the call cuts it (step 10). */
export default serveApp({
  manifest,
  handlers: {
    ...handlers,
    travar: () => {
      let voltas = 0
      while (voltas >= 0) voltas += 1
    },
  },
})
