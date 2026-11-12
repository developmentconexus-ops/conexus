// Defect: a connector double answers in a shape the real service never sends, so a test passes on
// a part the connector wants and the real body breaks it (testing T24, T29).
// `npm run record-connector -- --connector mercado-livre --case <case> --out <folder>` sends one
// of the card's four reads (`pedidos-alterados`, `anuncios-varredura-1`, `anuncios-varredura-2`,
// `perguntas-varredura`) as the Hub builds and sends it, and keeps the body as it arrived in
// `<folder>/<case>.raw.json`; the folder must be outside the repository, since the body is real.
// The second page of the scan reads the first page's `scroll_id` from the same folder.
// `... --case <case> --out <folder> --swap` replaces every value of that raw body by an invented
// one of the same shape and saves the recording in `packages/connectors/src/<connector>/recordings/`,
// with the service, the route, the date and the paths it replaced beside it.
// `... --plan` prints the four requests as the operations declare them, with the seller's id, the
// changed-from date and the first page's `scroll_id` left as marks, for `gravar_ml.py`, the same four
// reads from a machine where only Python runs; the raw files it keeps carry `ACCOUNT` where the id was.
// The credential comes from the environment only and never reaches a file or the output (security
// S40): CONEXUS_RECORD_ML_TOKEN (a seller's access token) and CONEXUS_RECORD_ML_SELLER (the
// seller's id, the account the read is for).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { CONNECTORS } from '@conexus/connectors'
import { z } from 'zod'
import { ACCOUNT, assertOutside, CASES, planned, Raw, recorded } from './record-connector-calls.ts'
import { swapped } from './record-connector-swap.ts'

const ROOT = join(import.meta.dirname, '..')
const Args = z.object({
  connector: z.literal('mercado-livre'),
  case: z.enum(CASES).optional(),
  out: z.string().min(1).optional(),
  swap: z.boolean().default(false),
  plan: z.boolean().default(false),
})
const Seller = z.object({ CONEXUS_RECORD_ML_SELLER: z.string().min(1) })
const Env = Seller.extend({ CONEXUS_RECORD_ML_TOKEN: z.string().min(1) })
const Run = z.object({ case: z.enum(CASES), out: z.string().min(1) })

const { values } = parseArgs({
  options: {
    connector: { type: 'string' },
    case: { type: 'string' },
    out: { type: 'string' },
    swap: { type: 'boolean' },
    plan: { type: 'boolean' },
  },
})
const args = Args.parse(values)
const connector = CONNECTORS.find((candidate) => candidate.id === args.connector)
if (connector === undefined) throw new Error(`No connector ${args.connector}`)
if (args.plan) {
  console.log(JSON.stringify(planned(connector), null, 2))
  process.exit(0)
}
const run = Run.parse(args)
const out = assertOutside(run.out, ROOT)
function rawPath(name: string) {
  return join(out, `${name}.raw.json`)
}

if (args.swap) {
  const raw = Raw.parse(JSON.parse(readFileSync(rawPath(run.case), 'utf8')))
  const account = Seller.safeParse(process.env).data?.CONEXUS_RECORD_ML_SELLER ?? ACCOUNT
  const done = swapped({ body: raw.body, account, path: raw.path })
  const folder = join(ROOT, 'packages/connectors/src', connector.id, 'recordings')
  mkdirSync(folder, { recursive: true })
  const recording = {
    service: connector.name,
    connector: connector.id,
    case: raw.case,
    route: { method: raw.method, path: done.path, query: Object.keys(raw.query).sort() },
    recordedAt: raw.recordedAt,
    status: raw.status,
    replaced: done.replaced,
    body: done.body,
  }
  writeFileSync(join(folder, `${raw.case}.json`), `${JSON.stringify(recording, null, 2)}\n`)
  console.log(`Saved ${raw.case}.json with ${done.replaced.length} replaced paths.`)
} else {
  const env = Env.parse(process.env)
  const first =
    run.case === 'anuncios-varredura-2'
      ? Raw.parse(JSON.parse(readFileSync(rawPath('anuncios-varredura-1'), 'utf8'))).body
      : null
  const raw = await recorded({
    fetch,
    connector,
    name: run.case,
    account: env.CONEXUS_RECORD_ML_SELLER,
    token: env.CONEXUS_RECORD_ML_TOKEN,
    now: new Date(),
    first,
  })
  mkdirSync(out, { recursive: true })
  writeFileSync(rawPath(run.case), JSON.stringify(raw, null, 2))
  console.log(`Kept ${run.case}.raw.json (status ${raw.status}) in the folder.`)
}
