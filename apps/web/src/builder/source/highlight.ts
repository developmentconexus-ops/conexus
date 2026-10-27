import type { HighlighterCore, ThemedToken } from 'shiki/core'

/** A piece of a line, already with the brand's class; never `style`, never HTML. */
export type Token = { text: string; className: string }

/** The largest file drawn with colour; a bigger one stays plain text, and Shiki is never called. */
const CEILING = 256 * 1024

/** The grammars an app's files use, each its own chunk, loaded the first time a file needs it. */
const GRAMMARS = {
  tsx: () => import('shiki/langs/tsx.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
} as const
type Grammar = keyof typeof GRAMMARS

const BY_EXTENSION: Record<string, Grammar> = {
  tsx: 'tsx',
  jsx: 'tsx',
  ts: 'typescript',
  js: 'typescript',
  mjs: 'typescript',
  json: 'json',
  css: 'css',
  html: 'html',
  sql: 'sql',
  md: 'markdown',
}

/** The css-variables theme names a colour as `var(--shiki-…)`; the brand owns each value (V3). */
const COLOURS: Record<string, string> = {
  'var(--shiki-token-keyword)': 'text-code-keyword',
  'var(--shiki-token-string)': 'text-code-string',
  'var(--shiki-token-comment)': 'text-code-comment',
  'var(--shiki-token-function)': 'text-code-function',
  'var(--shiki-token-constant)': 'text-code-constant',
  'var(--shiki-token-parameter)': 'text-code-parameter',
  'var(--shiki-token-string-expression)': 'text-code-expression',
  'var(--shiki-token-link)': 'text-code-string',
}

const ITALIC = 1

let highlighter: Promise<HighlighterCore> | undefined

function load(): Promise<HighlighterCore> {
  highlighter ??= Promise.all([import('shiki/core'), import('shiki/engine/javascript')]).then(
    ([core, engine]) =>
      core.createHighlighterCore({
        themes: [core.createCssVariablesTheme({ name: 'conexus' })],
        langs: [],
        // The JavaScript engine: no WebAssembly, so the page keeps `script-src 'self'`.
        engine: engine.createJavaScriptRegexEngine(),
      }),
  )
  return highlighter
}

function classOf(token: ThemedToken): string {
  const colour = token.color === undefined ? undefined : COLOURS[token.color]
  const italic = token.fontStyle !== undefined && (token.fontStyle & ITALIC) === ITALIC
  return [colour, italic && 'italic'].filter(Boolean).join(' ')
}

/**
 * The file's lines as tokens, or `null` when it stays plain text: no grammar for its kind, above
 * the ceiling, or a grammar that failed to load (C50: no failure leaves the page).
 */
export async function highlighted(path: string, text: string): Promise<Token[][] | null> {
  const grammar = BY_EXTENSION[path.split('.').at(-1)?.toLowerCase() ?? '']
  if (grammar === undefined || new TextEncoder().encode(text).byteLength > CEILING) return null
  try {
    const shiki = await load()
    if (!shiki.getLoadedLanguages().includes(grammar)) {
      await shiki.loadLanguage(GRAMMARS[grammar]())
    }
    return shiki
      .codeToTokens(text, { lang: grammar, theme: 'conexus' })
      .tokens.map((line) =>
        line.map((token) => ({ text: token.content, className: classOf(token) })),
      )
  } catch (cause) {
    console.warn(`The grammar of ${path} did not load; the file stays plain text.`, cause)
    return null
  }
}
