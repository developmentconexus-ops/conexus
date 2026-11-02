import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent, DialogTrigger } from '../../ui/dialog.tsx'
import { SidebarGroupAction } from '../../ui/sidebar.tsx'
import { companyQuery } from '../identity/public.ts'
import { NameStep } from './name-step.tsx'
import { projectsQuery } from './queries.ts'

/**
 * The **+** on the sidebar's Projetos group, or "Novo projeto" in the header of Início's Projetos
 * block (`block`): a dialog asking what a Projeto needs, its name for now, which creates it and
 * opens its page. Every member may create (`createProject`'s admission), so the button is always
 * there; a refusal shows on the name field.
 */
export function NewProjectDialog(props: { companyId: CompanyId; block?: boolean }) {
  const { companyId } = props
  const [open, setOpen] = useState(false)
  const created = useRef(false)
  const navigate = useNavigate()
  const company = useQuery(companyQuery(companyId)).data?.company
  const databaseReady = useQuery(projectsQuery(companyId, undefined)).data?.databaseReady === true
  /** The + gets focus back on Cancelar or Esc; after creating, the new Projeto's page owns it. */
  function finalFocus() {
    return !created.current
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) created.current = false
        setOpen(next)
      }}
    >
      {props.block ? (
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>
          <PlusIcon aria-hidden="true" />
          <span className="max-[400px]:sr-only">Novo projeto</span>
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<SidebarGroupAction aria-label="Novo projeto" />}>
          <PlusIcon aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent
        title="Novo projeto"
        description="Um Projeto precisa só de um nome, por enquanto."
        finalFocus={finalFocus}
      >
        {company && (
          <NameStep
            company={company}
            databaseReady={databaseReady}
            locked={null}
            idle="Criar projeto"
            back="Cancelar"
            onCreated={async (project) => {
              created.current = true
              await navigate({
                to: '/companies/$companyId/projects/$projectId',
                params: { companyId, projectId: project.id },
              })
              setOpen(false)
            }}
            onBack={() => setOpen(false)}
            onOpenProject={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
