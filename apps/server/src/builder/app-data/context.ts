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

const HOW_TO_READ = [
  '## Data',
  'The company\'s copies released to this Project are tables of the `sync` schema, read only: write `sync.<name>` and put every column in double quotes exactly as it is listed below, in its own case (`select "CODVEND" from sync.vendas`).',
  'Count a read on the real data with `app_data_check`, and see a few rows with `app_data_read`; the Project app reads the same table through `db`. A copy has no row count here: ask `app_data_check`.',
  'Where a connector copies, the app reads the company data from the copy (`sync.<name>`, through `db`) and you propose the copy that is missing with `copy_propose`. Reading the system live (`connector_read`) is for you to investigate. An app reads a system live only for a connector with no copy (today, Mercado Livre) and to write. A refusal with `42501` on a listed copy means its release is still pending: say so, and do not work around it.',
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

function releasedLine(copy: Released): string {
  const columns = copy.columns.map(({ name, type }) => `"${name}" ${type}`).join(', ')
  return `- \`sync.${copy.name}\` (${modeText(copy.mode)}): ${columns}`
}

/**
 * The "## Data" block (founder, 2026-11-10: "Pergunta 1, Okay"): stable between copy runs, so the
 * instructions keep their cache. It holds no row count and no hour, only the definitions and the
 * releases; past 8 KB the copies that follow are named, and `app_data_check` gives their columns.
 */
export function dataContext(view: ProjectCopiesView): string {
  if (view.kind === 'FAILED') return UNANSWERED
  if (view.released.length === 0 && view.unreleased.length === 0) return ''
  const others =
    view.unreleased.length === 0
      ? []
      : [
          `Released to other Projects or not yet released here: ${view.unreleased.map((name) => `\`sync.${name}\``).join(', ')}. Ask the owner to release one to this Project; never propose a copy that exists.`,
        ]
  const whole = view.released.some(({ mode }) => mode.kind === 'WHOLE') ? [WHOLE_WEIGHT] : []
  const fixed = [...HOW_TO_READ, ...whole, ...others]
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
  return [...HOW_TO_READ, ...listed, ...tail, ...whole, ...others].join('\n')
}
