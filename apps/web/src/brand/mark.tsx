const MARK_PIECES = ['M4 4H18V14H10V28H4Z', 'M28 28H14V18H22V4H28Z'] as const
const ARRIVE_MOTION = ['motion-safe:animate-fit-a', 'motion-safe:animate-fit-b'] as const
const WORKING_MOTION = ['motion-safe:animate-working-a', 'motion-safe:animate-working-b'] as const

// Decorative on purpose: the wordmark names the product and the working line names the work, so
// the mark never carries meaning a screen reader would miss. Working wins over arriving.
export function ConexusMark({
  arrive = false,
  working = false,
  size = 32,
}: Readonly<{ arrive?: boolean; working?: boolean; size?: number }>) {
  const motion = working ? WORKING_MOTION : arrive ? ARRIVE_MOTION : null
  return (
    <svg
      className="block flex-none text-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      {MARK_PIECES.map((piece, index) => (
        <path
          key={piece}
          className={`[transform-box:view-box] ${motion?.[index] ?? ''}`}
          d={piece}
          fill="currentColor"
        />
      ))}
    </svg>
  )
}

/** `word="md"` shows only the mark below the `md` breakpoint, as a phone's top bar does (design V56). */
export function ConexusWordmark({
  arrive = false,
  word = 'always',
}: Readonly<{ arrive?: boolean; word?: 'always' | 'md' }>) {
  return (
    <span
      className="inline-flex items-center gap-[.3em] whitespace-nowrap font-display font-semibold leading-none tracking-[-0.03em] text-[32px] text-text"
      role="img"
      aria-label="Conexus"
    >
      <ConexusMark arrive={arrive} />
      <span aria-hidden="true" className={word === 'md' ? 'hidden md:inline' : undefined}>
        Co<em className="not-italic text-mark">nexus</em>
      </span>
    </span>
  )
}
