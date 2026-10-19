import { serveApp } from '@conexus/app-contract'
import manifest from '../manifest.json' with { type: 'json' }
import { handlers } from './recados.ts'

/** Recados: a list of short notes, the smallest app that writes to the company's database. */
export default serveApp({ manifest, handlers })
