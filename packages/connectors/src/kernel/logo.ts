/** The most a logo takes: the official Sankhya file measures 6,857 bytes, rounded up to the next KB (7,168). */
export const LOGO_MAX_BYTES = 7168

const LEADING = /^(?:\s|<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->)*<svg[\s>]/
const SCRIPT = /<script/i
const HANDLER = /\son[a-z]+\s*=/i
const LINK = /(?:^|[\s:])href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi
const URL_FUNCTION = /url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi

/**
 * What stops a file from being shown as an `<img>` logo: not an SVG, too big, a script, an event
 * handler, or a link that leaves the file (`xmlns` namespaces are names, not links).
 */
export function logoProblems(svg: string): string[] {
  const problems: string[] = []
  if (!LEADING.test(svg)) problems.push('does not start with <svg')
  if (Buffer.byteLength(svg) > LOGO_MAX_BYTES) problems.push(`is over ${LOGO_MAX_BYTES} bytes`)
  if (SCRIPT.test(svg)) problems.push('has a <script')
  if (HANDLER.test(svg)) problems.push('has an on…= attribute')
  for (const [, double, single] of svg.matchAll(LINK))
    if (!(double ?? single ?? '').startsWith('#')) problems.push('has an href that leaves the file')
  for (const [, , target] of svg.matchAll(URL_FUNCTION))
    if (!target?.startsWith('#')) problems.push('has a url( that leaves the file')
  return problems
}
