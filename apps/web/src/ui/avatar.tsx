import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `avatar`; Conexus has no pictures yet, so only the fallback.
export function Avatar({ className, ...props }: AvatarPrimitive.Root.Props) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-7 shrink-0 overflow-hidden rounded-pill border border-line select-none',
        className,
      )}
      {...props}
    />
  )
}

export function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center bg-surface-3 font-body text-eyebrow text-text-2',
        className,
      )}
      {...props}
    />
  )
}
