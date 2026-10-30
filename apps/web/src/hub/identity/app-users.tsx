import type { CompanyAppPerson, CompanyId } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { SectionTitle } from '../../ui/list.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Empty } from '../../ui/states.tsx'
import { FramedTable, TableBody, TableCell, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { ActionDialog, isGone } from './member-actions.tsx'
import { companyAppAccessQuery, revokeEveryApp } from './queries.ts'

type Person = CompanyAppPerson

function RevokeEverywhere({ companyId, person }: { companyId: CompanyId; person: Person }) {
  const [open, setOpen] = useState(false)
  const send = useMutation(revokeEveryApp)
  return (
    <ActionDialog
      open={open}
      onOpenChange={setOpen}
      trigger={{
        label: 'Tirar de todos',
        name: `Tirar de todos os apps: ${person.name}`,
        danger: true,
      }}
      title={`Tirar ${person.name} de todos os apps?`}
      description="O próximo clique em qualquer app é recusado. A conta continua."
      confirm={{ label: 'Tirar de todos', pending: 'Tirando…' }}
      write={send}
      onConfirm={() =>
        send.mutate(
          { params: { companyId, personId: person.personId } },
          { onSuccess: () => setOpen(false), onError: (error) => isGone(error) && setOpen(false) },
        )
      }
    />
  )
}

function Apps({ companyId, person }: { companyId: CompanyId; person: Person }) {
  return (
    <span className="flex flex-col gap-xs">
      {person.apps.map((app) => (
        <Link
          key={app.projectId}
          to="/companies/$companyId/projects/$projectId/access"
          params={{ companyId, projectId: app.projectId }}
          className="wrap-anywhere underline"
        >
          {app.projectName}
          {app.role !== null &&
            (app.roleLabel === null ? (
              <span className="text-danger"> · Papel que a versão publicada não tem mais</span>
            ) : (
              ` · ${app.roleLabel}`
            ))}
        </Link>
      ))}
    </span>
  )
}

/**
 * "Quem usa os apps": the people from outside the company with the apps they use, each app leading
 * to its Projeto's section; whoever manages takes a person from every app at once (step 18, H).
 */
export function AppUsers(props: { companyId: CompanyId; page: string | undefined }) {
  const { companyId, page } = props
  const { data } = useSuspenseQuery(companyAppAccessQuery(companyId, page))
  const phone = useIsMobile()
  return (
    <section className="flex flex-col gap-lg">
      <SectionTitle>Quem usa os apps</SectionTitle>
      {!data.mayManage && (
        <p className="text-text-2">Só o dono ou um administrador dá ou tira acesso aos apps.</p>
      )}
      {data.people.length === 0 ? (
        <Empty>Ninguém de fora da empresa usa os apps.</Empty>
      ) : (
        <FramedTable
          aria-label="Quem usa os apps"
          columns={[{ name: 'Pessoa' }, { name: 'Apps', leavesOnPhone: true }, { name: 'Ações' }]}
        >
          <TableBody>
            {data.people.map((person) => (
              <TableRow key={person.personId}>
                <TableCell className="whitespace-normal px-sm">
                  <span className="flex flex-col gap-xs">
                    <span className="wrap-anywhere">{person.name}</span>
                    <span className="wrap-anywhere text-label text-text-2">{person.email}</span>
                    {phone && <Apps companyId={companyId} person={person} />}
                  </span>
                </TableCell>
                {!phone && (
                  <TableCell className="whitespace-normal px-sm">
                    <Apps companyId={companyId} person={person} />
                  </TableCell>
                )}
                <TableCell className="w-px px-sm">
                  {data.mayManage && <RevokeEverywhere companyId={companyId} person={person} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </FramedTable>
      )}
      <Pager next={data.next} param="apps" page={page} list="Quem usa os apps" />
    </section>
  )
}
