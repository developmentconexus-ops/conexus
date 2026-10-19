// Recados that does not start (step 10): its module throws before a request arrives, so Cloudflare
// refuses its upload with 10021.
export { default } from '../../recados/src/index.ts'

throw new Error('Recados não inicia')
