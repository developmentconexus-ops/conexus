import type { Db } from '@conexus/app-contract'
import { serveApp } from '@conexus/app-contract'
import manifest from '../manifest.json' with { type: 'json' }

async function rowsOf(result: Awaited<ReturnType<Db['query']>>) {
  if ('error' in result) throw new Error(`Banco recusou: ${result.error.code}`)
  return result.rows
}

/** The runtime already checked the shape; this only tells TypeScript what it holds. */
function textoOf(input: unknown): string {
  if (typeof input === 'object' && input !== null && 'texto' in input) return String(input.texto)
  throw new Error('Entrada sem texto')
}

/** Recados: a list of short notes, the smallest app that writes to the company's database. */
export default serveApp({
  manifest,
  handlers: {
    listarRecados: async (_input, { db }) =>
      rowsOf(await db.query('SELECT id, texto FROM recado ORDER BY id DESC LIMIT 100')),
    escreverRecado: async (input, { db }) => {
      const written = await db.batch([
        { text: 'INSERT INTO recado (texto) VALUES ($1) RETURNING id', values: [textoOf(input)] },
      ])
      if ('error' in written) throw new Error(`Banco recusou: ${written.error.code}`)
      return written.results[0]?.rows[0]
    },
  },
})
