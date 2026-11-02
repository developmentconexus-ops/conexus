import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CheckIcon, CircleIcon } from 'lucide-react'
import { buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { preparationOf, teamDone } from './preparation.ts'
import { everyMemberQuery, invitationsQuery } from './queries.ts'

export const NO_SHARED_ACCOUNT =
  'A empresa ainda não tem conta de modelo compartilhada. Só quem ligou a própria conta consegue conversar.'

/** The company's people and its first page of invitations, once both are read. */
function useTeamReads(companyId: CompanyId) {
  const members = useQuery(everyMemberQuery(companyId))
  const invitations = useQuery(invitationsQuery(companyId, undefined))
  if (members.data === undefined || invitations.data === undefined) return undefined
  return { members: members.data, invitations: invitations.data.invitations }
}

/** Whether the company has a team yet, or undefined while its reads load. */
export function useTeamDone(companyId: CompanyId): boolean | undefined {
  const team = useTeamReads(companyId)
  return team && teamDone(team)
}

function Step({ done, label }: { done: boolean; label: string }) {
  const Icon = done ? CheckIcon : CircleIcon
  return (
    <li className="flex items-center gap-xs text-label text-text-2">
      <Icon aria-hidden="true" className={done ? 'size-4 text-success' : 'size-3.5'} />
      {label}: {done ? 'feito' : 'falta'}
    </li>
  )
}

/**
 * "Termine de preparar a empresa", on Início for an owner or an administrator while the company has
 * no model account of its own or no team (web W33). "Continuar" opens the section that is missing.
 * While its reads load or if one fails, it is not shown.
 */
export function PreparationCard(props: { companyId: CompanyId; companyAccounts: number }) {
  const { companyId } = props
  const team = useTeamReads(companyId)
  if (team === undefined) return null
  const done = preparationOf({ companyAccounts: props.companyAccounts, ...team })
  if (done.modelAccount && done.team) return null
  const missing = done.modelAccount
    ? ('/companies/$companyId/settings/people' as const)
    : ('/companies/$companyId/settings/model-accounts' as const)
  return (
    <section
      aria-label="Termine de preparar a empresa"
      className="flex flex-wrap items-center justify-between gap-md rounded-object border border-line px-lg py-sm max-md:py-md"
    >
      <div className="flex flex-col gap-xs">
        <div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:gap-xl">
          <h2 className="font-semibold text-label">Termine de preparar a empresa</h2>
          <ul className="flex flex-wrap gap-x-lg gap-y-xs">
            {/* Início opens only once the nickname is saved, so step 1 is always done here. */}
            <Step done label="Empresa" />
            <Step done={done.modelAccount} label="Conta de modelo" />
            <Step done={done.team} label="Convidar equipe" />
          </ul>
        </div>
        {/* A person's own account does not count (W33): whoever linked one can talk all the same. */}
        {done.modelAccount ? null : <p className="text-label text-text-2">{NO_SHARED_ACCOUNT}</p>}
      </div>
      <Link
        to={missing}
        params={{ companyId }}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'max-md:border-line max-md:bg-surface max-md:text-text',
        )}
      >
        Continuar
      </Link>
    </section>
  )
}
