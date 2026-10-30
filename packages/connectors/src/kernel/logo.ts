/** The most a logo takes: a symbol is small; the old wide Sankhya wordmark measured 6,857 bytes, rounded up to the next KB. */
export const LOGO_MAX_BYTES = 7168

/** How far from square a logo may be (width over height): a symbol, never a wide wordmark. */
const LOGO_ASPECT_RANGE = [0.75, 1.34] as const

const LEADING = /^(?:\s|<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->)*<svg[\s>]/
const SCRIPT = /<script/i
const HANDLER = /\son[a-z]+\s*=/i
const LINK = /(?:^|[\s:])href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi
const VIEW_BOX =
  /<svg[^>]*\sviewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i
const URL_FUNCTION = /url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi

/**
 * What stops a file from being shown as an `<img>` logo: not an SVG, too big, a script, an event
 * handler, a link that leaves the file (`xmlns` namespaces are names, not links), or a wide
 * wordmark: every connector's logo is its square symbol without the written name (founder, 2026-10-29).
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
  const box = VIEW_BOX.exec(svg)
  if (box) {
    const aspect = Number(box[1]) / Number(box[2])
    const [min, max] = LOGO_ASPECT_RANGE
    if (!(aspect >= min && aspect <= max))
      problems.push(
        `is not square (${box[1]}×${box[2]}): the logo is the provider's symbol without the written name`,
      )
  }
  return problems
}
