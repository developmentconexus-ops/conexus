import type { UseQueryResult } from '@tanstack/react-query'
import { sentenceOf } from '../../platform/hub.ts'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'

/** What a list shows while its read is on the way, and when it failed, with **Tentar de novo**. */
export function ReadStates({ read }: { read: UseQueryResult }) {
  if (read.isPending) return <Skeleton className="h-16 w-full" />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  return null
}
