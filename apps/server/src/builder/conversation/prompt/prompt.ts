import { readFileSync } from 'node:fs'
import type { Repository, Sha } from '../../git/public.ts'

/** The prompt (card of step 14, U7): Conexus OS `e0353c36` `builder.md`, as the card's table adapts it. */
const TEMPLATE = readFileSync(new URL('./builder.md', import.meta.url), 'utf8')

/**
 * The knowledge cutoff the prompt states, `Month YYYY`, by the model id a conversation stores; a
 * model with no entry gets no cutoff clause, so the prompt never guesses one (Conexus OS
 * `e0353c36` `harness/model-cutoffs.ts`).
 */
export const MODEL_KNOWLEDGE_CUTOFFS: Readonly<Record<string, string>> = Object.freeze({
  'anthropic/claude-opus-5-5': 'June 2026',
})

export type PromptValues = Readonly<{
  projectName: string
  /** Today, `YYYY-MM-DD`, in `America/Sao_Paulo`. */
  date: string
  /** Null drops the clause. */
  cutoff: string | null
  /** True while the Projeto's `main` is still the starter; the new-app line is dropped otherwise. */
  starter: boolean
  appFolder: string
  /** How many failed checks end the turn with the code saved as not built. */
  checks: number
  /** `AGENTS.md` as read from `main`, or the line that says why it is empty. */
  instructions: string
  /** `.conexus/memory/MEMORY.md` as read from `main`, or the line that says why it is empty. */
  memory: string
}>

// One pass over the template, so text a placeholder brings in is never read as another placeholder.
const PLACEHOLDER =
  /^- This app is new: it has only the starter screen\.\n| Your knowledge cutoff: \{cutoff\}\.|\{project name\}|\{date\}|\{app folder\}|\{checks\}|\{AGENTS\.md content\}|\{index\}/gm

/** The prompt with the turn's values in place (Conexus OS `e0353c36` `harness/prompt.ts:45-59`). */
export function fillPrompt(values: PromptValues): string {
  return TEMPLATE.replace(PLACEHOLDER, (slot) => {
    if (slot.startsWith('- This app is new')) return values.starter ? slot : ''
    if (slot.startsWith(' Your knowledge cutoff'))
      return values.cutoff === null ? '' : ` Your knowledge cutoff: ${values.cutoff}.`
    switch (slot) {
      case '{project name}':
        return values.projectName
      case '{date}':
        return values.date
      case '{app folder}':
        return values.appFolder
      case '{checks}':
        return String(values.checks)
      case '{AGENTS.md content}':
        return values.instructions
      default:
        return values.memory
    }
  })
}

/** Today as `YYYY-MM-DD` in `America/Sao_Paulo` (Conexus OS `e0353c36` `harness/prompt.ts:91-92`). */
export function turnDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
}

const INSTRUCTIONS_PATH = 'AGENTS.md'
const MEMORY_PATH = '.conexus/memory/MEMORY.md'
// The prompt's share of each file and the most read at all (Conexus OS `e0353c36`
// `builder/project-context.ts:13-17`).
const INSTRUCTIONS_BYTES = 8 * 1024
const MEMORY_BYTES = 16 * 1024
const MEMORY_LINES = 200
const READ_BYTES = 1024 * 1024

const encoder = new TextEncoder()

/** The longest start of `text` within `limit` UTF-8 bytes that ends between two characters. */
function cutToBytes(text: string, limit: number): string {
  const bytes = encoder.encode(text)
  let cut = Math.min(limit, bytes.length)
  while (cut > 0 && cut < bytes.length && ((bytes[cut] ?? 0) & 0xc0) === 0x80) cut -= 1
  return new TextDecoder().decode(bytes.subarray(0, cut))
}

function missing(path: string): string {
  return `[${path} is missing; treat it as empty.]`
}

/** A file of `main` for the prompt: its text, cut with a note past its limit, or the line that says why it is empty. */
async function fileForPrompt(
  repository: Repository,
  input: { sha: Sha; path: string; cut: (text: string) => string | null; note: string },
): Promise<string> {
  const { path } = input
  const read = await repository.file({ sha: input.sha, path, maxBytes: READ_BYTES })
  switch (read.kind) {
    case 'not-found':
      return missing(path)
    case 'too-large':
      return `[${path} is too large to read; treat it as empty.]`
    case 'not-text':
      return `[${path} is not UTF-8 text; treat it as empty.]`
    case 'text': {
      const kept = input.cut(read.text)
      return kept === null ? read.text.trim() : `${kept.trimEnd()}\n\n[${input.note}]`
    }
    default:
      return read satisfies never
  }
}

function cutInstructions(text: string): string | null {
  return encoder.encode(text).length > INSTRUCTIONS_BYTES
    ? cutToBytes(text, INSTRUCTIONS_BYTES)
    : null
}

function cutMemory(text: string): string | null {
  const lines = text.split('\n')
  const byLines = lines.length > MEMORY_LINES ? lines.slice(0, MEMORY_LINES).join('\n') : text
  const over = byLines.length < text.length || encoder.encode(byLines).length > MEMORY_BYTES
  return over ? cutToBytes(byLines, MEMORY_BYTES) : null
}

/**
 * What the prompt carries from the Projeto's `main`, never from the machine, so a turn cannot put
 * its own text into the next turn's prompt before a version is saved (Conexus OS `e0353c36`
 * `builder/project-context.ts:4-9`). A Projeto with no `main` yet starts from the starter (U3).
 */
export async function projectContext(
  repository: Repository,
): Promise<Pick<PromptValues, 'starter' | 'instructions' | 'memory'>> {
  const head = await repository.head()
  const starter = head === null || (await repository.version()) === 0
  if (head === null) {
    return { starter, instructions: missing(INSTRUCTIONS_PATH), memory: missing(MEMORY_PATH) }
  }
  const [instructions, memory] = await Promise.all([
    fileForPrompt(repository, {
      sha: head,
      path: INSTRUCTIONS_PATH,
      cut: cutInstructions,
      note: 'AGENTS.md was cut at 8 KB; the rest is not shown.',
    }),
    fileForPrompt(repository, {
      sha: head,
      path: MEMORY_PATH,
      cut: cutMemory,
      note: 'MEMORY.md was cut at 200 lines or 16 KB; the rest is not shown. Keep the index shorter.',
    }),
  ])
  return { starter, instructions, memory }
}
