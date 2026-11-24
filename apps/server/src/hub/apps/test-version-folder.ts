export const MIGRATION = {
  id: '001_recado',
  statements: [
    'CREATE TABLE recado (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, texto text NOT NULL)',
  ],
}

function base64(value: string): string {
  return Buffer.from(value).toString('base64')
}

/** A version's folder as the machine's check leaves it: a small Recados, its files in base64 (T19). */
export function folder(change: Record<string, unknown> = {}, color = '#0b6e4f') {
  const manifest = {
    contract: 1,
    entry: 'worker.js',
    operations: {
      listarRecados: { input: { type: 'object', properties: {} }, output: { type: 'string' } },
    },
    migrations: [MIGRATION],
    assets: ['index.html', 'style.css'],
    ...change,
  }
  return {
    manifest,
    files: [
      { path: 'worker.js', mediaType: 'text/javascript', base64: base64('export default {}') },
      { path: 'assets/index.html', mediaType: 'text/html', base64: base64('<h1>Recados</h1>') },
      { path: 'assets/style.css', mediaType: 'text/css', base64: base64(`:root{--cor:${color}}`) },
    ],
  }
}

export type Folder = ReturnType<typeof folder>
