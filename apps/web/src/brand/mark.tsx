const MARK_PIECES = ['M4 4H18V14H10V28H4Z', 'M28 28H14V18H22V4H28Z'] as const
const PIECE_MOTION = ['motion-safe:animate-fit-a', 'motion-safe:animate-fit-b'] as const

const WORDMARK_CLASS = {
  xs: 'text-[18px]',
  sm: 'text-[20px]',
  md: 'text-[26px]',
  lg: 'text-[32px]',
} as const

function ConexusMark({ size = 24, arrive = false }: Readonly<{ size?: number; arrive?: boolean }>) {
  return (
    <svg
      className="block flex-none text-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      data-motion={arrive ? 'fit-once' : 'still'}
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

export function ConexusWordmark({
  size = 'sm',
  markSize,
  arrive = false,
}: Readonly<{
  size?: 'xs' | 'sm' | 'md' | 'lg'
  markSize?: number
  arrive?: boolean
}>) {
  const sizeInPixels = { xs: 18, sm: 20, md: 26, lg: 32 }[size]
  return (
    <span
      className={`inline-flex items-center gap-[.3em] whitespace-nowrap font-display font-semibold leading-none tracking-[-0.03em] text-text ${WORDMARK_CLASS[size]}`}
      role="img"
      aria-label="Conexus"
    >
      <ConexusMark size={markSize ?? sizeInPixels} arrive={arrive} />
      <span aria-hidden="true">
        Co<em className="not-italic text-mark">nexus</em>
      </span>
    </span>
  )
}
