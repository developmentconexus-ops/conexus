import type { Client } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { useLeaveClient } from './leave-client.ts'
import { sendDeletion } from './queries.ts'

/**
 * A client the Central started to delete and the company's database kept from finishing: the same
 * request with the same body resumes it, with no name to type again (step 7, P3).
 */
export function FinishDeletion({ client }: { client: Client }) {
  const send = useMutation(sendDeletion)
  const leave = useLeaveClient(client.companyId)

  async function finish() {
    try {
      await send.mutateAsync({
        params: { companyId: client.companyId },
        body: { name: client.name, revision: client.revision },
      })
      await leave('deleted')
    } catch (error) {
      if (error instanceof HubFailure && error.code === 'NOT_FOUND') await leave('gone')
    }
  }

  return (
    <div className="flex flex-col items-start gap-md">
      <p role="status">Exclusão em andamento.</p>
      <Button variant="danger" disabled={send.isPending} onClick={() => void finish()}>
        {send.isPending ? 'Concluindo…' : 'Tentar concluir exclusão'}
      </Button>
      {send.isError && (
        <p role="alert" className="text-label text-danger">
          {sentenceOf(send.error)}
        </p>
      )}
    </div>
  )
}
