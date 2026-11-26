import { cn } from './cn.ts'

// shadcn's `skeleton`, painted with the stronger fill, which shows on the sheet and on what floats;
// the pulse stops under reduced motion.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'h-5 animate-pulse rounded-control bg-surface-4 motion-reduce:animate-none',
        className,
      )}
    />
  )
}
