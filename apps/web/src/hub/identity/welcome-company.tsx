import {
  appHostOf,
  CompanyNickname,
  hostLabelOf,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  setCompanyNickname,
  suggestedNickname,
} from '@conexus/hub-api'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { HubFailure } from '../../platform/hub.ts'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { chooseNickname, companyQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId_/welcome/company')
const ON_THE_FIELD = ['COMPANY_NICKNAME_TAKEN', 'COMPANY_NICKNAME_RESERVED']

/**
 * Step 1, "Sua empresa": the name the Central registered, read only, and the nickname the apps'
 * addresses carry, suggested from the name, with the address it gives as it is typed. Saved, or
 * found saved already, the next step opens.
 */
export function WelcomeCompany() {
  const { companyId } = route.useParams()
  const { company } = useSuspenseQuery(companyQuery(companyId)).data
  const router = useRouter()
  const queryClient = useQueryClient()
  const send = useMutation(chooseNickname)
  const form = useSchemaForm(setCompanyNickname.input.body, {
    nickname: suggestedNickname(company.name),
  })
  const typed = CompanyNickname.safeParse(form.watch('nickname'))
  const example = typed.success ? hostLabelOf({ name: 'pedidos', nickname: typed.data }) : undefined

  // The company's guards read it again, with its nickname, before the next step opens.
  async function next() {
    await queryClient.invalidateQueries({
      queryKey: companyQuery(companyId).queryKey,
      refetchType: 'all',
    })
    await router.navigate({
      to: '/companies/$companyId/welcome/model-account',
      params: { companyId },
    })
  }

  async function submit(values: { nickname: CompanyNickname }) {
    try {
      await send.mutateAsync({ params: { companyId }, body: values })
      await next()
    } catch (error) {
      if (!(error instanceof HubFailure)) setServerError(form, error)
      else if (error.code === 'COMPANY_NICKNAME_SET') await next()
      else if (error.code === 'NOT_FOUND') {
        // The company is gone for this person: the guard reads it again and shows what the Hub says.
        queryClient.removeQueries({ queryKey: companyQuery(companyId).queryKey })
        await router.invalidate()
      } else if (ON_THE_FIELD.includes(error.code)) setServerError(form, error, 'nickname')
      // The rest above the button, in its row's words; none of this operation's rows asks to retry.
      else setServerError(form, error)
    }
  }

  return (
    <div className="flex flex-col gap-lg">
      <p className="text-text-2">
        O apelido vai no endereço dos apps da empresa. Depois de salvo, não dá para trocar.
      </p>
      <dl className="flex flex-col gap-xs">
        <dt className="text-label text-text-2">Nome da empresa</dt>
        <dd className="text-text">{company.name}</dd>
      </dl>
      <Form form={form} onSubmit={submit}>
        <TextField
          name="nickname"
          label="Apelido"
          type="text"
          autoComplete="off"
          invalid={`Use de ${NICKNAME_MIN_LENGTH} a ${NICKNAME_MAX_LENGTH} letras minúsculas, números ou hífens.`}
        />
        {example && (
          <p className="text-label text-text-2">
            Exemplo de endereço:{' '}
            <span className="font-mono text-fact">
              {appHostOf({ label: example, appsDomain: company.appsDomain })}
            </span>
          </p>
        )}
        <FormAlert />
        <SubmitButton idle="Salvar e continuar" pending="Salvando…" />
      </Form>
    </div>
  )
}
