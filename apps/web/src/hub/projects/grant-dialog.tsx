import type { CompanyId, ConnectionId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { GRANT, grantText, projectConnectionsKey, sendGrant } from '../connectors/public.ts'
import { ActionDialog } from '../identity/public.ts'

/**
 * "Liberar para ler": the confirmation says what the grant gives, the whole connection, and the
 * list is read again whether it was granted or refused, since a refusal says the list was stale.
 */
export function GrantDialog(props: {
  companyId: CompanyId
  projectId: ProjectId
  connectionId: ConnectionId
  connectionName: string
  connectorName: string
}) {
  const { companyId, projectId, connectionId } = props
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const grant = useMutation({
    ...sendGrant,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: projectConnectionsKey(companyId, projectId) }),
  })
  return (
    <ActionDialog
      open={open}
      onOpenChange={setOpen}
      trigger={{ label: GRANT, name: `${GRANT}: ${props.connectionName}`, danger: false }}
      title={`Liberar ${props.connectionName} para este Projeto?`}
      description={grantText(props.connectorName)}
      confirm={{ label: 'Liberar', pending: 'Liberando…' }}
      write={grant}
      onConfirm={() =>
        grant.mutate(
          { params: { companyId, projectId, connectionId } },
          { onSuccess: () => setOpen(false) },
        )
      }
    />
  )
}
