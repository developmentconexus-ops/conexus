import { Skeleton } from '../../ui/skeleton.tsx'

/** The frame stays and the content is a skeleton while a read is open (web W34). */
export function Waiting() {
  return (
    <div role="status" aria-label="Carregando">
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
