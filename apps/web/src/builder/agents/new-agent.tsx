import type { CompanyId } from '@conexus/hub-api'
import { Link, useNavigate } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { ProjectPicker } from '../../hub/projects/public.ts'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { CREATE_PROJECT, NEW_AGENT, NEW_AGENT_WHERE, NO_PROJECTS_FOR_AGENT } from './text.ts'

/**
 * **Novo agente** at Início: no agent lives outside a Projeto, so it asks which one and goes to that
 * Projeto's Agentes area, where the Construtor begins the conversation. With no Projeto, it says so
 * and leads to the Projetos page (issue 708).
 */
export function NewAgent({ companyId }: { companyId: CompanyId }) {
  const navigate = useNavigate()
  return (
    <ProjectPicker<never>
      companyId={companyId}
      label={NEW_AGENT}
      title={NEW_AGENT_WHERE}
      trigger={() => (
        <Button variant="primary">
          <PlusIcon aria-hidden="true" />
          {NEW_AGENT}
        </Button>
      )}
      value={undefined}
      onPick={(projectId) =>
        void navigate({
          to: '/companies/$companyId/projects/$projectId/agents',
          params: { companyId, projectId },
        })
      }
      before={[]}
      after={[]}
      recentFor={undefined}
      empty={
        <div className="flex flex-col items-start gap-sm">
          <span>{NO_PROJECTS_FOR_AGENT}</span>
          <Link
            to="/companies/$companyId/projects"
            params={{ companyId }}
            className={buttonVariants({ size: 'sm' })}
          >
            {CREATE_PROJECT}
          </Link>
        </div>
      }
    />
  )
}
