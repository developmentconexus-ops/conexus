import { useMutationState } from '@tanstack/react-query'
import { z } from 'zod'
import type { RunRequest } from './queries.ts'
import { sendCopyEnable, sendCopyRun } from './queries.ts'

const Variables = z.object({ params: z.object({ copyId: z.string() }) })
const Enabled = z.object({ copy: z.object({ id: z.string() }) })
const Before = z.object({ before: z.string().nullable() })

/** What the person asked to run that the list may not show yet: Rodar agora (the run it saw then rides in `meta`) and Ligar (no run yet). */
export function useRunRequests(): RunRequest[] {
  const ran = useMutationState({
    filters: { mutationKey: sendCopyRun.mutationKey, status: 'success' },
    select: (mutation) => ({
      at: mutation.state.submittedAt,
      copyId: Variables.safeParse(mutation.state.variables).data?.params.copyId,
      before: Before.safeParse(mutation.meta).data?.before ?? null,
    }),
  })
  const enabled = useMutationState({
    filters: { mutationKey: sendCopyEnable.mutationKey, status: 'success' },
    select: (mutation) => ({
      at: mutation.state.submittedAt,
      copyId: Enabled.safeParse(mutation.state.data).data?.copy.id,
      before: null,
    }),
  })
  return [...ran, ...enabled].flatMap(({ copyId, ...rest }) =>
    copyId === undefined ? [] : [{ ...rest, copyId }],
  )
}
