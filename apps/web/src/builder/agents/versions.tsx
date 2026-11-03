import type { AgentId, CompanyId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { dayOf } from '../../platform/dates.ts'
import { sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { agentQuery, agentsPrefix, sendActivation, versionsQuery } from './queries.ts'
import { NO_VERSIONS, UNCONFIRMED_PUBLISH } from './text.ts'

/** **Versões** of an agent: the published ones, newest first, and **Voltar para a versão n** (criterion 27). */
export function Versions(props: { companyId: CompanyId; projectId: ProjectId; agentId: AgentId }) {
  const { agentId } = props
  const scope = { companyId: props.companyId, projectId: props.projectId }
  const queryClient = useQueryClient()
  const read = useQuery(versionsQuery(scope, agentId))
  const activate = useMutation(sendActivation)
  const [error, setError] = useState<string>()

  async function back(number: number) {
    setError(undefined)
    try {
      const { agent } = await activate.mutateAsync({
        params: { ...scope, agentId, number: String(number) },
      })
      queryClient.setQueryData(agentQuery(scope, agentId).queryKey, { agent })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: versionsQuery(scope, agentId).queryKey }),
        queryClient.invalidateQueries({ queryKey: agentsPrefix(scope) }),
      ])
    } catch (failure) {
      setError(writeFailureText(failure, UNCONFIRMED_PUBLISH))
    }
  }

  return (
    <section aria-labelledby="versions-title" className="flex flex-col gap-sm">
      <h3 id="versions-title" className="font-display text-title">
        Versões
      </h3>
      {read.isPending && <Skeleton className="h-16 w-full" />}
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {read.data?.versions.length === 0 && <p className="text-text-2">{NO_VERSIONS}</p>}
      <ul className="flex flex-col divide-y divide-line">
        {read.data?.versions.map((version) => (
          <li
            key={version.number}
            className="flex flex-wrap items-center justify-between gap-sm py-sm"
          >
            <span className="flex min-w-0 flex-col">
              <span>
                Versão {version.number}
                {version.active && <span className="text-success"> · ativa</span>}
              </span>
              <span className="break-words text-label text-text-2">
                {dayOf(version.publishedAt)}
                {version.publishedBy !== null && ` · ${version.publishedBy.name}`}
                {version.message !== '' && ` · ${version.message}`}
              </span>
            </span>
            {!version.active && (
              <Button
                size="sm"
                disabled={activate.isPending}
                onClick={() => void back(version.number)}
              >
                Voltar para a versão {version.number}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {error !== undefined && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </section>
  )
}
