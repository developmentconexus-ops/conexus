import type { ClientSummary } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { dayOf } from '../../platform/dates.ts'
import { buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { List, PageTitle, Row, rowBody } from '../../ui/list.tsx'
import { Notice } from '../../ui/notice.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Empty } from '../../ui/states.tsx'
import { maskedCnpj } from './cnpj.ts'
import { clientsQuery } from './queries.ts'

const route = getRouteApi('/_app/operations/clients/')

// What the list says after a deletion: the dialog's, or of a client already gone (step 5).
const NOTICES = {
  deleted: 'Cliente apagado.',
  gone: 'Este cliente não existe mais.',
  unconfirmed: 'O último cadastro ficou sem resposta. O cliente está nesta lista?',
} as const

const INVITATION_STATE = {
  PENDING: 'Aguardando o administrador',
  EXPIRED: 'Convite vencido',
  DECLINED: 'Convite recusado',
  CANCELED: 'Convite cancelado',
} as const

/** What a client's row says of its state: who it awaits, or that it is active. */
function stateText(state: ClientSummary['state']): string {
  switch (state.kind) {
    case 'AWAITING_OWNER': {
      const { ownerInvitation } = state
      return `${INVITATION_STATE[ownerInvitation.state]}: ${ownerInvitation.email}`
    }
    case 'ACTIVE':
      return 'Ativo'
    case 'DELETING':
      return 'Exclusão em andamento'
    default:
      return state satisfies never
  }
}

function ClientRow({ client }: { client: ClientSummary }) {
  return (
    <Row>
      <Link
        to="/operations/clients/$companyId"
        params={{ companyId: client.companyId }}
        // Below sm the date goes under the text, which wraps: the CNPJ and the e-mail stay whole.
        className={cn(rowBody({ kind: 'link' }), 'max-sm:flex-col max-sm:items-stretch')}
      >
        <span className="flex min-w-0 flex-col wrap-anywhere">
          <span>{client.name}</span>
          <span className="text-label text-text-2">
            {client.legalName} · {maskedCnpj(client.cnpj)}
          </span>
          <span className="text-label text-text-2">{stateText(client.state)}</span>
        </span>
        <span className="shrink-0 text-label text-text-2">
          Cadastrado em {dayOf(client.registeredAt)}
        </span>
      </Link>
    </Row>
  )
}

/** The Operations Central's list of clients, 50 a page, the page in the address (web W18). */
export function Clients() {
  const { page, notice: arrived } = route.useSearch()
  const navigate = route.useNavigate()
  // The notice is for this visit: it leaves the address, so a reload or a copied link does not repeat it.
  const [notice] = useState(arrived)
  useEffect(() => {
    if (arrived) void navigate({ search: { page }, replace: true })
  }, [arrived, navigate, page])
  const { data } = useSuspenseQuery(clientsQuery(page))
  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <PageTitle>Central de Operação</PageTitle>
        <Link to="/operations/clients/new" className={buttonVariants({ variant: 'primary' })}>
          Cadastrar cliente
        </Link>
      </div>
      {notice && <Notice>{NOTICES[notice]}</Notice>}
      {data.clients.length === 0 ? (
        <Empty>Nenhum cliente cadastrado.</Empty>
      ) : (
        <List>
          {data.clients.map((client) => (
            <ClientRow key={client.companyId} client={client} />
          ))}
        </List>
      )}
      <Pager next={data.next} param="page" page={page} list="Clientes" />
    </div>
  )
}
