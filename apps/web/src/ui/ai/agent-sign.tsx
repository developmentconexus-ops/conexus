import { BotIcon } from 'lucide-react'
import type { ReactElement } from 'react'
import { ConexusMark } from '../../brand/mark.tsx'

export type Signer = 'CONEXUS' | 'COMPANY_AGENT'

export function AgentSign(props: { signer: Signer; working: boolean }): ReactElement {
  if (props.signer === 'COMPANY_AGENT')
    return (
      <BotIcon aria-hidden="true" data-slot="agent-icon" className="size-4 flex-none text-text-2" />
    )
  return <ConexusMark working={props.working} size={16} />
}
