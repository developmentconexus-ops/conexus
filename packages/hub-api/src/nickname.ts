import { z } from 'zod'
import { CompanyNickname } from './address.ts'
import { CompanyDetail, InCompany } from './companies.ts'
import { defineOperation } from './operation.ts'

export const setCompanyNickname = defineOperation({
  id: 'setCompanyNickname',
  summary: 'Sets, once, the nickname the company’s apps’ addresses carry; only its owner sets it.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/nickname',
  bodyLimit: 1024,
  input: { params: InCompany, body: z.object({ nickname: CompanyNickname }) },
  success: { status: 200, body: z.object({ company: CompanyDetail }) },
  failures: [
    'NOT_FOUND',
    'COMPANY_NICKNAME_TAKEN',
    'COMPANY_NICKNAME_RESERVED',
    'COMPANY_NICKNAME_SET',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})
