import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { defineConnector } from '../kernel/definition.ts'
import { oauth2Code, rfc6749Answer } from '../kernel/oauth.ts'
import { AccountRef } from '../kernel/operation.ts'
import { readSkill } from '../kernel/skill.ts'
import { contatos } from './operations/contatos.ts'
import { hubspotOperations, hubspotSubjects } from './operations/index.ts'
import { notaNoContato } from './operations/nota.ts'

const SKILL = new URL('./skill/', import.meta.url)

const LOGO = readFileSync(new URL('./logo.svg', import.meta.url), 'utf8')

export const hubspot = defineConnector({
  id: 'hubspot',
  name: 'HubSpot',
  version: '1.0.0',
  origin: 'https://api.hubapi.com',
  // A confirmar na gravação (9.1): that HubSpot takes PKCE S256, the token path, the answer's shape,
  // the refusals and where the call limit is counted. The shelf gives the pages and the origin
  // (nango providers.yaml:13028-13045) and the answer is RFC 6749 §5.1.
  auth: oauth2Code({
    credentialClass: 'EXCLUSIVE',
    app: { from: 'installation' },
    authorize: {
      url: 'https://app.hubspot.com/oauth/authorize',
      pkce: 'S256',
      params: {
        scope:
          'oauth crm.objects.contacts.read crm.objects.companies.read crm.objects.deals.read crm.objects.contacts.write settings.account.read',
      },
    },
    token: { path: '/oauth/2026-09/token' },
    answer: rfc6749Answer,
    refusals: { grant: ['invalid_grant'], app: ['invalid_client'] },
  }),
  account: {
    kind: 'reported',
    exclusive: true,
    who: {
      path: '/account-info/v3/details',
      answer: z.object({ portalId: z.number().int() }).transform(({ portalId }) => ({
        ref: AccountRef.parse(String(portalId)),
        label: `Portal ${portalId}`,
      })),
    },
  },
  category: 'CRM',
  summary: 'O CRM onde a empresa guarda contatos, empresas e negócios.',
  logo: LOGO,
  numbers: 'DOUBLE',
  perProject: 'many',
  callLimit: { countedBy: 'ACCOUNT' },
  subjects: hubspotSubjects,
  operations: hubspotOperations,
  writes: [notaNoContato],
  check: contatos,
  skill: { written: readSkill(SKILL) },
})
