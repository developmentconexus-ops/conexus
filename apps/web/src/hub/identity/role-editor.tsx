import type { CompanyId, ConnectorEntry, RoleView } from '@conexus/hub-api'
import { createRole, ROLE_LABEL_MAX, RoleConnectors, updateRole } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import {
  Form,
  FormAlert,
  SubmitButton,
  setWriteError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { changeCompanyRole, createCompanyRole } from './queries.ts'
import { DeleteRole } from './role-delete.tsx'
import { ConnectorPicker } from './role-picker.tsx'

const UNCONFIRMED = 'Não confirmamos a gravação. Veja a lista de papéis.'

type Connectors = Record<string, string[]>

function Picked(props: { kit: readonly ConnectorEntry[]; readOnly: boolean; logo: Logo }) {
  const { control } = useFormContext()
  const { field } = useController({ name: 'connectors', control })
  const value: Connectors = field.value
  return (
    <div className="flex flex-col gap-md">
      {props.kit.map((entry) => (
        <ConnectorPicker
          key={entry.id}
          entry={entry}
          held={value[entry.id] ?? []}
          readOnly={props.readOnly}
          logo={props.logo}
          onChange={(next) => {
            const { [entry.id]: _, ...others } = value
            field.onChange(next.length === 0 ? others : { ...others, [entry.id]: next })
          }}
        />
      ))}
    </div>
  )
}

export function Back({ companyId }: { companyId: CompanyId }) {
  return (
    <Link
      to="/companies/$companyId/settings/roles"
      params={{ companyId }}
      search={{}}
      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'self-start')}
    >
      <ArrowLeftIcon aria-hidden="true" className="size-4" />
      Papéis
    </Link>
  )
}

type Logo = (entry: ConnectorEntry) => ReactNode
type Common = {
  companyId: CompanyId
  kit: readonly ConnectorEntry[]
  logo: Logo
  onDone: () => void
}

/** "Novo papel": the name, then what the role uses of each connector. */
export function NewRole({ companyId, kit, logo, onDone }: Common) {
  const send = useMutation(createCompanyRole)
  const form = useSchemaForm(createRole.input.body, { label: '', connectors: {} })
  return (
    <div className="flex flex-col gap-lg">
      <Back companyId={companyId} />
      <PageTitle className="text-display-narrow">Novo papel</PageTitle>
      <Form
        form={form}
        onSubmit={async (values) => {
          try {
            await send.mutateAsync({ params: { companyId }, body: values })
            onDone()
          } catch (error) {
            setWriteError(form, error, UNCONFIRMED, { ROLE_NAME_TAKEN: 'label' })
          }
        }}
      >
        <TextField
          name="label"
          label="Nome do papel"
          type="text"
          autoComplete="off"
          maxLength={ROLE_LABEL_MAX}
          invalid={`Escreva o nome do papel, com até ${ROLE_LABEL_MAX} letras.`}
        />
        <Picked kit={kit} readOnly={false} logo={logo} />
        <FormAlert />
        <SubmitButton idle="Criar papel" pending="Criando…" />
      </Form>
    </div>
  )
}

/** An open role: the owner and the administrator only read, the others change what they use of each connector. */
export function OpenRole({ companyId, kit, logo, role, onDone }: Common & { role: RoleView }) {
  const send = useMutation(changeCompanyRole)
  const fixed = role.kind === 'ALL'
  const form = useSchemaForm(updateRole.input.body, {
    connectors: Object.fromEntries(
      Object.entries(role.connectors).map(([id, operations]) => [id, [...operations]]),
    ),
  })
  return (
    <div className="flex flex-col gap-lg">
      <Back companyId={companyId} />
      <PageTitle className="text-display-narrow">{role.label}</PageTitle>
      {fixed && (
        <p className="text-text-2">
          Dono e Administrador usam tudo de todos os conectores, sempre. Este papel não muda.
        </p>
      )}
      <Form
        form={form}
        onSubmit={async (values) => {
          try {
            await send.mutateAsync({
              params: { companyId, role: role.role },
              body: { connectors: RoleConnectors.parse(values.connectors) },
            })
            onDone()
          } catch (error) {
            setWriteError(form, error, UNCONFIRMED)
          }
        }}
      >
        <Picked kit={kit} readOnly={fixed} logo={logo} />
        <FormAlert />
        {!fixed && <SubmitButton idle="Salvar" pending="Salvando…" />}
      </Form>
      {role.kind === 'CUSTOM' && (
        <DeleteRole companyId={companyId} role={role.role} label={role.label} onDeleted={onDone} />
      )}
    </div>
  )
}
