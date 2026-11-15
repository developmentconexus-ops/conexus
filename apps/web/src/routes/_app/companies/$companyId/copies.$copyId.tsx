import { createFileRoute, redirect } from '@tanstack/react-router'
import { copyParams, TableSearch } from '../../../../hub/copies/public.ts'

// The table's page is under Dados now (Dados, parte 1): the old address leads there, with its search.
export const Route = createFileRoute('/_app/companies/$companyId/copies/$copyId')({
  params: copyParams,
  validateSearch: TableSearch,
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: '/companies/$companyId/data/$copyId',
      params,
      search,
      replace: true,
    })
  },
})
