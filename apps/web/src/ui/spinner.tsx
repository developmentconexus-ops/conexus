import { Loader2Icon } from 'lucide-react'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `spinner`: the label is required, since the turning icon is a
// `status`; the turn stops under reduced motion.
export function Spinner({ label, className }: { label: string; className?: string }) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label={label}
      className={cn('size-4 motion-safe:animate-spin', className)}
    />
  )
}
