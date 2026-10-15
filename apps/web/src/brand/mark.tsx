const MARK_PIECES = ['M4 4H18V14H10V28H4Z', 'M28 28H14V18H22V4H28Z'] as const
const PIECE_MOTION = ['motion-safe:animate-fit-a', 'motion-safe:animate-fit-b'] as const

// Decorative on purpose: the wordmark names the product, so the mark never carries meaning a
// screen reader would miss.
function ConexusMark({ arrive }: Readonly<{ arrive: boolean }>) {
  return (
    <svg
      className="block flex-none text-mark"
      width={32}
      height={32}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      {MARK_PIECES.map((piece, index) => (
        <path
          key={piece}
          className={`[transform-box:view-box] ${arrive ? PIECE_MOTION[index] : ''}`}
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
