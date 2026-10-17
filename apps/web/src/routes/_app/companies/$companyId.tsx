import { CompanyId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { idOrNotFound } from '../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId')({
  params: {
    parse: (raw) => ({ companyId: idOrNotFound(CompanyId, raw.companyId) }),
    stringify: (p) => p,
  },
})
