import type { CopyMode } from '@conexus/hub-api'
import type { ProjectCopiesView } from '../../hub/copies/public.ts'

/** What the block spends on the released copies' lines; the rest are named only. */
const BLOCK_BYTES = 8 * 1024

const encoder = new TextEncoder()
function bytesOf(text: string): number {
  return encoder.encode(text).length
}

const UNANSWERED =
  "The company's copies did not answer now; do not assume there are none. Try again before you tell the person a copy is missing."

/** The source rule, the same sentence here, in the Builder's prompt and in `conexus-data` (O Sync de qualquer conector, U4). */
export const SOURCE_RULE =
  'Where a connector copies or declares a read that lists rows, the app reads the company data from the copy (`sync.<name>`, through `db`) and you propose the copy that is missing with `copy_propose`; an app reads a system live only for a connector with neither, and to write.'

const HOW_TO_READ = [
  '## Data',
  'The company\'s copies released to this Project are tables of the `sync` schema, read only: write `sync.<name>` and put every column in double quotes exactly as it is listed below, in its own case (`select "CODVEND" from sync.vendas`).',
  'Count a read on the real data with `app_data_check`, and see a few rows with `app_data_read`; the Project app reads the same table through `db`. A copy has no row count here: ask `app_data_check`.',
  `${SOURCE_RULE} Reading the system live (\`connector_read\`) is for you to investigate. A refusal with \`42501\` on a listed copy means its release is still pending: say so, and do not work around it.`,
  'A copy listed here is on and released to this Project: nothing is left to activate. One marked as your proposal is the proposal you made, which the person turned on; it is read here, on the next turn after they turn it on. Never write in the plan or the code that the data waits for someone to activate a copy without looking at this block.',
]

const WHOLE_WEIGHT =
  'A whole copy rereads the entire source on every pass, so a large source makes it heavy: read it as the data of the last pass, and say so to the person.'

function modeText(mode: CopyMode): string {
  switch (mode.kind) {
    case 'WHOLE':
      return 'whole copy: each pass reads the whole source'
    case 'WINDOW':
      return `window of ${mode.days} days: each pass rereads the rows changed in the last ${mode.days} days`
    case 'CHANGES':
      return 'only what changed: each pass reads the rows changed since the last'
    default:
      return mode satisfies never
  }
}

type Released = Extract<ProjectCopiesView, { kind: 'COPIES' }>['released'][number]

/** The engine's columns of a copy whose sources have an account, first as the table's key has them. */
const ACCOUNT_COLUMNS = [
  { name: '_account', type: 'text', description: "the account's id in the connector" },
  { name: '_account_name', type: 'text', description: "the connection's name in Conexus" },
]

function originText(copy: Released): string {
  if (copy.source.kind === 'QUERY') return `the query of \`${copy.connector}\``
  const { operation, label, input } = copy.source
  const fixed = Object.keys(input).length === 0 ? '' : `, fixed input ${JSON.stringify(input)}`
  return `the read \`${operation}\` (${label}) of \`${copy.connector}\`${fixed}`
}

function releasedLine(copy: Released): string {
  const all = copy.accounts ? [...ACCOUNT_COLUMNS, ...copy.columns] : copy.columns
  const columns = all
    .map(({ name, type, description }) =>
      description === null ? `"${name}" ${type}` : `"${name}" ${type} (${description})`,
    )
    .join(', ')
  const described = copy.description === null ? '' : ` ${copy.description}.`
  const proposed = copy.proposedHere ? ' [your proposal, turned on]' : ''
  return `- \`sync.${copy.name}\`${proposed} (${modeText(copy.mode)}), from ${originText(copy)}.${described} Columns: ${columns}`
}

/**
 * The "## Data" block (founder, 2026-11-10: "Pergunta 1, Okay"): stable between copy runs, so the
 * instructions keep their cache. It holds no row count and no hour, only the definitions (where
 * each copy reads, its descriptions and columns) and the releases; past 8 KB the copies that follow are named, and `app_data_check` gives their columns.
 */
export function dataContext(view: ProjectCopiesView): string {
  if (view.kind === 'FAILED') return UNANSWERED
  if (view.released.length === 0 && view.unreleased.length === 0 && view.proposals.length === 0)
    return ''
  const waiting = view.proposals.map(
    ({ name, label }) =>
      `Your proposal \`sync.${name}\` (${label}) is open: it shows as a card in this conversation and waits for whoever may turn copies on, with the card's Ligar. It is not readable yet; go on with what does not depend on it, and look at this block on the next turn.`,
  )
  const others =
    view.unreleased.length === 0
      ? []
      : [
          `Released to other Projects or not yet released here: ${view.unreleased.map((name) => `\`sync.${name}\``).join(', ')}. Ask the owner to release one to this Project; never propose a copy that exists.`,
        ]
  const whole = view.released.some(({ mode }) => mode.kind === 'WHOLE') ? [WHOLE_WEIGHT] : []
  const fixed = [...HOW_TO_READ, ...whole, ...others, ...waiting]
  let budget = BLOCK_BYTES - bytesOf(fixed.join('\n'))
  const listed: string[] = []
  const named: string[] = []
  for (const copy of view.released) {
    const line = releasedLine(copy)
    // One copy past the budget starts the names-only tail, so the order stays the name's.
    if (named.length === 0 && bytesOf(line) + 1 <= budget) {
      listed.push(line)
      budget -= bytesOf(line) + 1
    } else named.push(`\`sync.${copy.name}\``)
  }
  const tail =
    named.length === 0
      ? []
      : [
          `More copies are released to this Project, named only: ${named.join(', ')}. \`app_data_check\` on \`select * from sync.<name>\` returns the columns of one.`,
        ]
  return [...HOW_TO_READ, ...listed, ...tail, ...whole, ...others, ...waiting].join('\n')
}
