import { serveApp } from '@conexus/app-contract'
import { operations } from './operations.ts'
import { handlers } from './recados.ts'

/** Recados: a list of short notes, the smallest app that writes to the company's database. */
export default serveApp({ operations, handlers })
