import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { signOut } from './queries.ts'

/** "Sair do Conexus": the session ends, the sign-in page says so, and the cache empties (web W28). */
export function useSignOut() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const send = useMutation(signOut)
  function leave() {
    send.mutate(undefined, {
      onSuccess: async () => {
        // Leaving first, so no screen of the frame reads again into an emptied cache (web W28).
        await router.navigate({ to: '/login', search: { reason: 'signed-out' } })
        queryClient.clear()
      },
    })
  }
  return { leave, pending: send.isPending, error: send.isError ? send.error : undefined }
}
