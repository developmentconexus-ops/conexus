import { serveApp } from '@conexus/app-contract'
import manifest from '../../recados/manifest.json' with { type: 'json' }
import { handlers, rowsOf, textoOf } from '../../recados/src/recados.ts'

/** Recados with a defect step 10 refuses at run time: it writes in `db.query`, which only reads. */
export default serveApp({
  manifest,
  handlers: {
    ...handlers,
    escreverRecado: async (input, { db }) =>
      (
        await rowsOf(
          await db.query('INSERT INTO recado (texto) VALUES ($1) RETURNING id', [textoOf(input)]),
        )
      )[0],
  },
})
