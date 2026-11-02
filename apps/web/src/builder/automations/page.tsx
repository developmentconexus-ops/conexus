import type { ProjectId } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { cn } from '../../ui/cn.ts'

/**
 * The column of an Automações page. The company's Início sits in a frame that pads and scrolls it
 * (as the Projetos list does); a Projeto's frame is compact, so there the page pads and scrolls
 * itself, as the Projeto's Conversas does.
 */
export function Page(props: {
  projectId: ProjectId | undefined
  gap: 'lg' | 'xl'
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex w-full max-w-page flex-col',
        props.gap === 'xl' ? 'gap-xl' : 'gap-lg',
        props.projectId !== undefined && 'mx-auto min-h-0 flex-1 overflow-y-auto p-xl',
      )}
    >
      {props.children}
    </div>
  )
}
