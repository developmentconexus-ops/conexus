import type { CompanyId, Role } from '@conexus/hub-api'
import { fixedNameOf, ROLE_LABELS } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { rolesQuery } from './queries.ts'
import { wordsOfStoredName } from './role-text.ts'

type Labels = (role: Role) => string

function fallback(role: Role): string {
  const fixed = fixedNameOf(role)
  return fixed === undefined ? wordsOfStoredName(role) : ROLE_LABELS[fixed]
}

const LabelsContext = createContext<Labels>(fallback)

/**
 * The company's own roles by the label their owner typed. Whoever reads the list of roles (owner
 * and administrator) gives it; everyone else reads the stored name as words until the Hub carries
 * the label to them.
 */
export function RoleLabels(props: { companyId: CompanyId; known: boolean; children: ReactNode }) {
  const read = useQuery({ ...rolesQuery(props.companyId), enabled: props.known })
  const labels = new Map((read.data?.roles ?? []).map((one) => [one.role, one.label]))
  return (
    <LabelsContext value={(role) => labels.get(role) ?? fallback(role)}>
      {props.children}
    </LabelsContext>
  )
}

/** The label a screen shows for a role. */
export function useRoleLabel(): Labels {
  return useContext(LabelsContext)
}
