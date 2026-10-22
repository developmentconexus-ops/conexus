import { serveApp } from '@conexus/app-contract'
import { operations } from '../../recados/src/operations.ts'
import { handlers, rowsOf, textoOf } from '../../recados/src/recados.ts'

/** Recados with a defect step 10 refuses at run time: it writes in `db.query`, which only reads. */
export default serveApp({
  operations,
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
