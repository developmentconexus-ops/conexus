import type { AgentDetail, CompanyId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ageOf, dayOf } from '../../platform/dates.ts'
import { writeFailureText } from '../../platform/hub.ts'
import { Stamp } from '../../ui/block.tsx'
import { Button } from '../../ui/button.tsx'
import { sendActivation, settleAgent, versionsQuery } from './queries.ts'
import { ReadStates } from './read-states.tsx'
import { Section } from './section.tsx'
import {
  ACTIVE_VERSION,
  DRAFT_STATE,
  NO_VERSIONS,
  UNCONFIRMED_PUBLISH,
  VERSIONS_TITLE,
} from './text.ts'

/**
 * **Versões** of an agent: the draft first when it is not published or moved past its version,
 * then the published ones, newest first, each in one line, and **Voltar para a versão n**
 * (criterion 27).
 */
export function Versions(props: {
  companyId: CompanyId
  projectId: ProjectId
  agent: AgentDetail
}) {
  const { agent } = props
  const scope = { companyId: props.companyId, projectId: props.projectId }
  const queryClient = useQueryClient()
  const read = useQuery(versionsQuery(scope, agent.id))
  const activate = useMutation(sendActivation)
  const [error, setError] = useState<string>()
  const unpublished = agent.state.kind === 'DRAFT' || agent.state.changed

  async function back(number: number) {
    setError(undefined)
    try {
      const { agent: made } = await activate.mutateAsync({
        params: { ...scope, agentId: agent.id, number: String(number) },
      })
      await settleAgent(queryClient, scope, made)
    } catch (failure) {
      setError(writeFailureText(failure, UNCONFIRMED_PUBLISH))
    }
  }

  return (
    <Section title={VERSIONS_TITLE} error={error}>
      <ReadStates read={read} />
      {read.data?.versions.length === 0 && !unpublished && (
        <p className="text-text-2">{NO_VERSIONS}</p>
      )}
      <ul className="flex flex-col divide-y divide-line">
        {unpublished && (
          <li className="flex flex-wrap items-center gap-sm py-sm">
            <Stamp tone="neutral">{DRAFT_STATE}</Stamp>
            <span className="text-label text-text-2">{ageOf(agent.updatedAt, new Date())}</span>
          </li>
        )}
        {read.data?.versions.map((version) => (
          <li
            key={version.number}
            className="flex flex-wrap items-center justify-between gap-sm py-sm"
          >
            <span className="flex min-w-0 flex-wrap items-center gap-x-sm gap-y-xxs">
              <span>v{version.number}</span>
              {version.active && <Stamp tone="success">{ACTIVE_VERSION}</Stamp>}
              <span className="break-words text-label text-text-2">
                {[
                  dayOf(version.publishedAt),
                  version.publishedBy?.name,
                  version.message === '' ? undefined : version.message,
                ]
                  .filter((part) => part !== undefined)
                  .join(' · ')}
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
    </Section>
  )
}
