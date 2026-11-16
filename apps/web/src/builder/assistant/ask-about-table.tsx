import type { CompanyId } from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import { SendIcon } from 'lucide-react'
import { buttonVariants } from '../../ui/button.tsx'
import { useDraft } from '../conversation/public.ts'

const ASK_ASSISTANT = 'Perguntar ao Assistente'

/** The line the link puts in Início's box: about which table the question is. */
function aboutTable(name: string): string {
  return `Sobre a tabela ${name}: `
}

/** A link to Início that leaves the table's line in its box, after what was already written, without sending it. */
export function AskAboutTable({ companyId, table }: { companyId: CompanyId; table: string }) {
  const draft = useDraft(`start:${companyId}`)
  return (
    <Link
      to="/companies/$companyId"
      params={{ companyId }}
      className={buttonVariants()}
      onClick={() => draft.append(aboutTable(table))}
    >
      <SendIcon aria-hidden="true" className="size-4" />
      {ASK_ASSISTANT}
    </Link>
  )
}
