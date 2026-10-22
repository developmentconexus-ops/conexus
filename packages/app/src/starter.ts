import { fileURLToPath } from 'node:url'

/**
 * The folder of the app a Projeto starts from (decision 0055): the first commit of its Git holds
 * these files, and the Builder edits them from there.
 */
export const STARTER_DIR = fileURLToPath(new URL('../starter', import.meta.url))
