import type { Db, Handler } from '@conexus/app-contract'

export async function rowsOf(result: Awaited<ReturnType<Db['query']>>) {
  if ('error' in result) throw new Error(`Banco recusou: ${result.error.code}`)
  return result.rows
}

/** The runtime already checked the shape; this only tells TypeScript what it holds. */
export function textoOf(input: unknown): string {
  if (typeof input === 'object' && input !== null && 'texto' in input) return String(input.texto)
  throw new Error('Entrada sem texto')
}

/** Recados's operations, which the defect apps of step 10 reuse but for the one each breaks. */
export const handlers = {
  listarRecados: async (_input, { db }) =>
    rowsOf(await db.query('SELECT id, texto FROM recado ORDER BY id DESC LIMIT 100')),
  escreverRecado: async (input, { db }) => {
    const written = await db.batch([
      { text: 'INSERT INTO recado (texto) VALUES ($1) RETURNING id', values: [textoOf(input)] },
    ])
    if ('error' in written) throw new Error(`Banco recusou: ${written.error.code}`)
    return written.results[0]?.rows[0]
  },
} satisfies Record<string, Handler>
